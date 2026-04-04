import bcrypt from 'bcryptjs';
import prisma from '../database/prisma.js';

const TIER_LIMITS = { free: 0, premium: 3, family: 6 };

const getEffectiveTier = (connection) => {
  const { subscriptionTier, subscriptionExpiresAt } = connection;
  if (
    subscriptionTier !== 'free' &&
    subscriptionExpiresAt &&
    new Date(subscriptionExpiresAt) < new Date()
  ) {
    return 'free';
  }
  return subscriptionTier || 'free';
};

const findOwnedProfile = async (profileId, connectionId) => {
  const profile = await prisma.profile.findFirst({
    where: { id: profileId, connectionId },
  });
  return profile;
};

export const getProfiles = async (req, res, next) => {
  try {
    const profiles = await prisma.profile.findMany({
      where: { connectionId: req.connection.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      select: {
        id: true, connectionId: true, name: true, avatar: true,
        isDefault: true, contentRating: true, blockedCategories: true,
        createdAt: true, updatedAt: true,
        // Never expose pin hash
      },
    });
    res.json({ success: true, data: profiles });
  } catch (error) {
    next(error);
  }
};

export const createProfile = async (req, res, next) => {
  try {
    const connectionId = req.connection.id;
    const tier  = getEffectiveTier(req.connection);
    const limit = TIER_LIMITS[tier] ?? 0;

    if (limit === 0) {
      return res.status(403).json({
        success: false,
        error: 'Profiles are not available on the free tier. Upgrade to Premium to create profiles.',
      });
    }

    const count = await prisma.profile.count({ where: { connectionId } });
    if (count >= limit) {
      return res.status(403).json({
        success: false,
        error: `Profile limit reached. ${tier} plan allows up to ${limit} profile(s).`,
      });
    }

    const { name, avatar, contentRating, blockedCategories } = req.body;
    const isDefault = count === 0; // First profile is the default

    const profile = await prisma.profile.create({
      data: {
        connectionId,
        name,
        avatar:           avatar           ?? null,
        contentRating:    contentRating    ?? 'none',
        blockedCategories: blockedCategories ?? [],
        isDefault,
      },
      select: {
        id: true, connectionId: true, name: true, avatar: true,
        isDefault: true, contentRating: true, blockedCategories: true,
        createdAt: true, updatedAt: true,
      },
    });

    res.status(201).json({ success: true, data: profile });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, error: 'A profile with this name already exists' });
    }
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { profileId } = req.params;
    const profile = await findOwnedProfile(profileId, req.connection.id);
    if (!profile) return res.status(404).json({ success: false, error: 'Profile not found' });

    const { name, avatar, contentRating, blockedCategories } = req.body;
    const updated = await prisma.profile.update({
      where: { id: profileId },
      data: {
        ...(name             !== undefined && { name }),
        ...(avatar           !== undefined && { avatar }),
        ...(contentRating    !== undefined && { contentRating }),
        ...(blockedCategories !== undefined && { blockedCategories }),
      },
      select: {
        id: true, connectionId: true, name: true, avatar: true,
        isDefault: true, contentRating: true, blockedCategories: true,
        createdAt: true, updatedAt: true,
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, error: 'A profile with this name already exists' });
    }
    next(error);
  }
};

export const deleteProfile = async (req, res, next) => {
  try {
    const { profileId } = req.params;
    const profile = await findOwnedProfile(profileId, req.connection.id);
    if (!profile) return res.status(404).json({ success: false, error: 'Profile not found' });
    if (profile.isDefault) {
      return res.status(400).json({ success: false, error: 'Cannot delete the default profile' });
    }

    await prisma.profile.delete({ where: { id: profileId } });
    res.json({ success: true, message: 'Profile deleted' });
  } catch (error) {
    next(error);
  }
};

export const setPin = async (req, res, next) => {
  try {
    const { profileId } = req.params;
    const profile = await findOwnedProfile(profileId, req.connection.id);
    if (!profile) return res.status(404).json({ success: false, error: 'Profile not found' });

    const { pin } = req.body;
    const hashed = await bcrypt.hash(pin, 10);
    await prisma.profile.update({ where: { id: profileId }, data: { pin: hashed } });

    res.json({ success: true, message: 'PIN set successfully' });
  } catch (error) {
    next(error);
  }
};

export const removePin = async (req, res, next) => {
  try {
    const { profileId } = req.params;
    const profile = await findOwnedProfile(profileId, req.connection.id);
    if (!profile) return res.status(404).json({ success: false, error: 'Profile not found' });

    await prisma.profile.update({ where: { id: profileId }, data: { pin: null } });
    res.json({ success: true, message: 'PIN removed' });
  } catch (error) {
    next(error);
  }
};

export const verifyPin = async (req, res, next) => {
  try {
    const { profileId } = req.params;
    const profile = await prisma.profile.findFirst({
      where: { id: profileId, connectionId: req.connection.id },
      select: { pin: true },
    });
    if (!profile) return res.status(404).json({ success: false, error: 'Profile not found' });

    if (!profile.pin) {
      return res.json({ success: true, valid: true, message: 'No PIN set on this profile' });
    }

    const { pin } = req.body;
    const valid = await bcrypt.compare(pin, profile.pin);
    res.json({ success: true, valid });
  } catch (error) {
    next(error);
  }
};
