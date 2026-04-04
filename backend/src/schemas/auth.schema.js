import { z } from 'zod';

// COPPA (13+) and Terms consent — required on both connection types
const consentFields = {
  agreedToTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the Terms of Service' }),
  }),
  isOver13: z.literal(true, {
    errorMap: () => ({ message: 'You must be 13 or older to use this app' }),
  }),
};

export const connectSchema = z.object({
  body: z.discriminatedUnion('type', [
    z.object({
      type:     z.literal('xtream'),
      name:     z.string().max(100).trim().optional(),
      username: z.string().min(1, 'Username is required').max(100).trim(),
      password: z.string().min(1, 'Password is required').max(200),
      url:      z.string().min(1, 'URL is required').max(500).trim(),
      ...consentFields,
    }),
    z.object({
      type:   z.literal('m3u'),
      name:   z.string().max(100).trim().optional(),
      m3uUrl: z.string().url('m3uUrl must be a valid URL').max(1000),
      ...consentFields,
    }),
  ]),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});
