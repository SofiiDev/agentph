import { z } from 'zod';

export const uploadRequestSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  fileBase64: z.string().min(1),
  projectId: z.string().uuid().optional(),
  dedupeByChecksum: z.boolean().optional()
});

export const searchRequestSchema = z.object({
  query: z.string().min(1),
  filters: z
    .object({
      documentType: z.string().min(1).optional(),
      onlyApproved: z.boolean().optional(),
      currentOnly: z.boolean().optional(),
      includeObsolete: z.boolean().optional(),
      tags: z.array(z.string()).optional(),
      topK: z.number().int().positive().max(50).optional()
    })
    .optional()
});

export const askRequestSchema = z.object({
  question: z.string().min(1),
  topK: z.number().int().positive().max(50).optional(),
  onlyApproved: z.boolean().optional()
});
