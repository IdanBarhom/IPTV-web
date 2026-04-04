import { z } from 'zod';

export const searchSchema = z.object({
  query: z.object({
    q:    z.string().min(1, 'Search query required').max(100),
    type: z.enum(['all', 'live', 'vod', 'series']).optional().default('all'),
    page:  z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});
