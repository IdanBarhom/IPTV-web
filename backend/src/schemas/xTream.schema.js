import { z } from 'zod';

const numericId = z.string().regex(/^\d+$/, 'Must be a numeric ID');
const mongoObjectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

export const categoryParamsSchema = z.object({
  params: z.object({
    categoryId: numericId,
  }),
  query: z.object({
    page:  z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
  }),
});

export const streamIdParamSchema = z.object({
  params: z.object({
    streamId: numericId,
  }),
});

export const vodStreamSchema = z.object({
  params: z.object({
    streamId: numericId,
  }),
  query: z.object({
    ext: z.enum(['mp4', 'mkv', 'ts', 'm3u8', 'avi']).optional(),
  }),
});

export const connectionIdSchema = z.object({
  params: z.object({
    id: mongoObjectId,
  }),
});

export const epgParamsSchema = z.object({
  params: z.object({
    streamId: numericId,
  }),
});
