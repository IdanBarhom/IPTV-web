import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

import { PORT } from '../config/env.js';
import logger from './utils/logger.js';
import authRouter from './routes/auth.routes.js';
import connectionRouter from './routes/connection.routes.js';
import xTreamRouter from './routes/xTream.routes.js';
import webhookRouter from './routes/webhook.routes.js';
import adsRouter from './routes/ads.routes.js';
import analyticsRouter from './routes/analytics.routes.js';
import favoritesRouter from './routes/favorites.routes.js';
import historyRouter from './routes/history.routes.js';
import searchRouter from './routes/search.routes.js';
import profileRouter from './routes/profile.routes.js';
import m3uRouter from './routes/m3u.routes.js';
import accountRouter from './routes/account.routes.js';
import { connectDB } from './database/prisma.js';
import errorMiddleware from './middleware/error.middleware.js';
import arcjetMiddleware from './middleware/arcjet.middleware.js';



dotenv.config();
const app = express();

app.use(helmet());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',')
        : '*',
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
if(process.env.NODE_ENV === 'production'){
  app.use(arcjetMiddleware)
}

// Attach a unique request ID to every request for tracing
app.use((req, res, next) => {
  const id = req.headers['x-request-id'] || crypto.randomUUID();
  req.id = id;
  res.setHeader('X-Request-ID', id);
  next();
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Legal endpoints — required by App Store and Google Play
app.get('/legal/privacy', (req, res) => {
  res.status(200).json({
    title: 'Privacy Policy',
    lastUpdated: '2025-04-04',
    sections: [
      {
        heading: 'Introduction',
        body: 'This Privacy Policy describes how we collect, use, and protect your information when you use our IPTV player application ("App"). By using the App, you agree to the practices described here.',
      },
      {
        heading: 'Information We Collect',
        body: 'We collect only what is necessary to operate the App: (1) IPTV connection credentials (server URL, username, password) stored AES-256-GCM encrypted; (2) subscription status managed by RevenueCat; (3) watch history and favorites you create within the App; (4) profile names and parental control settings. We do not collect your real name, email address, phone number, or government ID.',
      },
      {
        heading: 'How We Use Your Information',
        body: 'Your encrypted credentials are used solely to connect to your IPTV provider on your behalf. Watch history and favorites personalize your in-app experience. Subscription status gates premium features. We do not sell, rent, or share your personal data with third parties for marketing purposes.',
      },
      {
        heading: 'Data Storage and Security',
        body: 'Credentials are encrypted at rest using AES-256-GCM. Data is stored on Neon PostgreSQL (ISO 27001 certified). Cached data is stored in Upstash Redis with automatic TTL expiry. All communication between the App and our servers uses HTTPS/TLS.',
      },
      {
        heading: 'Data Retention',
        body: 'Your data is retained for as long as your account is active. You may delete your account and all associated data at any time using the "Delete Account" option in the App Settings. We will permanently erase all your data within 30 days of a deletion request.',
      },
      {
        heading: 'Your Rights (GDPR)',
        body: 'If you are in the European Economic Area, you have the right to: access your data (via Settings > Export My Data), correct inaccurate data, erase your data (via Settings > Delete Account), and receive your data in a portable format. To exercise these rights, use the in-app options or contact us.',
      },
      {
        heading: "Children's Privacy (COPPA)",
        body: 'This App is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you are under 13, you may not use this App. If we learn we have collected information from a child under 13, we will delete it promptly.',
      },
      {
        heading: 'Third-Party Services',
        body: 'The App integrates with RevenueCat (subscription management), AdMob/Google (ad attribution), and your chosen IPTV provider. Each third party is governed by their own privacy policy. We are not responsible for the privacy practices of your IPTV provider.',
      },
      {
        heading: 'Changes to This Policy',
        body: 'We may update this Privacy Policy from time to time. The "lastUpdated" date reflects the most recent revision. Continued use of the App after changes constitutes acceptance of the updated policy.',
      },
      {
        heading: 'Contact',
        body: 'For privacy-related requests or questions, please contact us through the App Store listing or our support channels.',
      },
    ],
  });
});

app.get('/legal/terms', (req, res) => {
  res.status(200).json({
    title: 'Terms of Service',
    lastUpdated: '2025-04-04',
    sections: [
      {
        heading: 'Acceptance of Terms',
        body: 'By downloading or using this App, you agree to be bound by these Terms of Service. If you do not agree, do not use the App.',
      },
      {
        heading: 'Description of Service',
        body: 'This App is an IPTV media player. It does not provide, host, stream, or distribute any television channels, movies, series, or other content. All content is provided exclusively by the IPTV service provider whose credentials you supply. We have no affiliation with your IPTV provider.',
      },
      {
        heading: 'User Responsibilities',
        body: 'You are solely responsible for: (1) ensuring your IPTV subscription is legally obtained and authorized in your jurisdiction; (2) complying with all applicable laws regarding the content you access; (3) maintaining the confidentiality of your IPTV credentials. Use of this App to access unauthorized or pirated content is strictly prohibited.',
      },
      {
        heading: 'Age Requirement',
        body: 'You must be at least 13 years old to use this App. Users under 18 must have parental or guardian consent. Certain premium content may require you to be 17 or older.',
      },
      {
        heading: 'IPTV Content Disclaimer',
        body: 'We are not responsible for the content available through your IPTV subscription. We do not curate, moderate, endorse, or control any channels or content accessible via third-party IPTV providers. Any illegal, offensive, or infringing content is the sole responsibility of the content provider and the user who accesses it.',
      },
      {
        heading: 'Intellectual Property',
        body: 'The App software, UI, and branding are owned by us and protected by copyright. You may not reverse-engineer, decompile, or create derivative works of the App.',
      },
      {
        heading: 'Disclaimer of Warranties',
        body: 'The App is provided "as is" without warranties of any kind. We do not guarantee uninterrupted service, content availability, or compatibility with any particular IPTV provider. Stream quality depends entirely on your IPTV provider and internet connection.',
      },
      {
        heading: 'Limitation of Liability',
        body: 'To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, or consequential damages arising from your use of the App.',
      },
      {
        heading: 'Termination',
        body: 'We reserve the right to suspend or terminate access to the App for violations of these Terms or for any other reason at our discretion.',
      },
      {
        heading: 'Governing Law',
        body: 'These Terms are governed by applicable law. Disputes shall be resolved in the jurisdiction where the App developer is located.',
      },
    ],
  });
});

app.get('/legal/dmca', (req, res) => {
  res.status(200).json({
    title: 'DMCA Safe Harbor Policy',
    lastUpdated: '2025-04-04',
    sections: [
      {
        heading: 'Our Role',
        body: 'This App is an IPTV media player. We do not host, store, transmit, or provide access to any content. All audio/video streams are served directly by third-party IPTV providers chosen by the user. We qualify for safe harbor protection under 17 U.S.C. § 512 (DMCA) as a service provider with no editorial control over user-supplied content sources.',
      },
      {
        heading: 'Notice of Claimed Infringement',
        body: 'If you believe that content accessible through a user\'s IPTV provider infringes your copyright, please direct your DMCA notice to the IPTV service provider that is hosting or transmitting that content. We have no ability to remove content from third-party IPTV servers.',
      },
      {
        heading: 'What We Can Act On',
        body: 'If you believe that our App software itself (code, UI assets, branding) infringes your copyright, please send a written notice containing: (1) identification of the copyrighted work; (2) identification of the infringing material and its location; (3) your contact information; (4) a statement of good faith belief; (5) a statement under penalty of perjury that the information is accurate and you are authorized to act on behalf of the copyright owner; (6) your physical or electronic signature.',
      },
      {
        heading: 'Repeat Infringer Policy',
        body: 'In appropriate circumstances, we will disable or terminate access for users who are repeat infringers.',
      },
      {
        heading: 'Contact',
        body: 'DMCA notices regarding the App software itself may be sent through the contact method listed on our App Store page.',
      },
    ],
  });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/connection', connectionRouter);
app.use('/api/v1/xTream',  xTreamRouter);
app.use('/webhooks', webhookRouter);
app.use('/ads', adsRouter);
app.use('/admin/analytics', analyticsRouter);
app.use('/api/v1/favorites', favoritesRouter);
app.use('/api/v1/history', historyRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/profiles', profileRouter);
app.use('/api/v1/m3u', m3uRouter);
app.use('/api/v1/account', accountRouter);
app.use(errorMiddleware)


app.get('/', (req, res) => {
  res.json({ message: '✅ Server is running locally!' });
});

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    logger.info(`Server running at http://localhost:${PORT}`);
  });
};

start();

export default app