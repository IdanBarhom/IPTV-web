import crypto from 'crypto';
import axios from 'axios';
import logger from '../utils/logger.js';

const KEY_SERVER_URL = 'https://www.gstatic.com/admob/reward/verifier-keys.json';

let _keys = null;
let _keysFetchedAt = 0;
const KEYS_TTL_MS = 60 * 60 * 1000; // Re-fetch keys every hour

/**
 * Fetches AdMob's public ECDSA keys from Google's CDN.
 * Results are cached in-memory for 1 hour to avoid repeated fetches.
 * @returns {Promise<Array<{ keyId: number, pem: string, base64: string }>>}
 */
async function getPublicKeys() {
  if (_keys && Date.now() - _keysFetchedAt < KEYS_TTL_MS) return _keys;
  const { data } = await axios.get(KEY_SERVER_URL, { timeout: 5000 });
  _keys = data.keys;
  _keysFetchedAt = Date.now();
  return _keys;
}

// Exported for tests only — resets the in-memory key cache so each test starts cold
export function _clearKeyCache() { _keys = null; _keysFetchedAt = 0; }

/**
 * AdMob Server-Side Verification (SSV) endpoint.
 *
 * Google calls this URL after a user completes a rewarded video ad.
 * We verify the ECDSA-SHA256 signature using Google's public keys.
 * Returning HTTP 200 tells Google the reward was granted on our side.
 * Any non-200 response causes AdMob to retry or withhold the reward.
 *
 * Query params sent by Google:
 *   ad_network, ad_unit, custom_data, key_id, reward_amount, reward_item,
 *   signature, timestamp, transaction_id, user_id
 *
 * @see https://developers.google.com/admob/android/ssv
 */
export const verifyAdReward = async (req, res, next) => {
  try {
    const { signature, key_id } = req.query;

    if (!signature || !key_id) {
      logger.warn('AdMob SSV: missing signature or key_id');
      return res.status(400).json({ success: false });
    }

    // Reconstruct the signed message: raw query string minus signature= and key_id= pairs
    const rawQuery = req.originalUrl.split('?')[1] || '';
    const message = rawQuery
      .split('&')
      .filter(pair => !pair.startsWith('signature=') && !pair.startsWith('key_id='))
      .join('&');

    // Fetch Google's public keys and find the one matching key_id
    const keys = await getPublicKeys();
    const keyEntry = keys.find(k => String(k.keyId) === String(key_id));
    if (!keyEntry) {
      logger.warn({ key_id }, 'AdMob SSV: unknown key_id');
      return res.status(400).json({ success: false });
    }

    // AdMob sends signatures as URL-safe base64 (base64url) — convert to standard base64
    const sigBuffer = Buffer.from(
      signature.replace(/-/g, '+').replace(/_/g, '/'),
      'base64'
    );

    const verify = crypto.createVerify('SHA256');
    verify.update(message);
    const isValid = verify.verify(keyEntry.pem, sigBuffer);

    if (!isValid) {
      logger.warn({ tid: req.query.transaction_id }, 'AdMob SSV: signature mismatch');
      return res.status(400).json({ success: false });
    }

    logger.info({
      userId:  req.query.user_id,
      reward:  req.query.reward_item,
      amount:  req.query.reward_amount,
      tid:     req.query.transaction_id,
    }, 'AdMob SSV: reward verified');

    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
};
