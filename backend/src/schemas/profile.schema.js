import { z } from 'zod';

const CONTENT_RATINGS = ['none', 'G', 'PG', 'PG-13', 'R', 'NC-17'];

export const createProfileSchema = z.object({
  body: z.object({
    name:             z.string().min(1).max(30).trim(),
    avatar:           z.string().max(200).optional(),
    contentRating:    z.enum(CONTENT_RATINGS).optional(),
    blockedCategories: z.array(z.string().max(50)).max(200).optional(),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name:             z.string().min(1).max(30).trim().optional(),
    avatar:           z.string().max(200).optional(),
    contentRating:    z.enum(CONTENT_RATINGS).optional(),
    blockedCategories: z.array(z.string().max(50)).max(200).optional(),
  }),
  params: z.object({
    profileId: z.string().min(1),
  }),
});

export const profileIdParamsSchema = z.object({
  params: z.object({
    profileId: z.string().min(1),
  }),
});

export const setPinSchema = z.object({
  body: z.object({
    pin: z.string().regex(/^\d{4,6}$/, 'PIN must be 4–6 digits'),
  }),
  params: z.object({
    profileId: z.string().min(1),
  }),
});

export const verifyPinSchema = z.object({
  body: z.object({
    pin: z.string().regex(/^\d{4,6}$/, 'PIN must be 4–6 digits'),
  }),
  params: z.object({
    profileId: z.string().min(1),
  }),
});
