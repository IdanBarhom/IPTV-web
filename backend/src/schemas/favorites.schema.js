import { z } from 'zod';

export const addItemSchema = z.object({
  body: z.object({
    type:      z.enum(['live', 'vod', 'series']),
    streamId:  z.string().min(1),
    title:     z.string().max(200).optional(),
    profileId: z.string().min(1).optional(),
  }),
});

export const removeParamsSchema = z.object({
  params: z.object({
    itemId: z.string().min(1, 'Invalid item ID'),
  }),
});
