import { z } from 'zod';

export const citationSchema = z.object({
  document_id: z.string().min(1),
  document_version: z.string().min(1),
  section: z.string().min(1),
  page_or_chunk: z.string().min(1),
  quote: z.string().min(1)
});

export const evidenceOutputSchema = z
  .object({
    status: z.enum(['ok', 'insufficient_evidence']),
    answer: z.string().min(1),
    citations: z.array(citationSchema)
  })
  .superRefine((payload, ctx) => {
    if (payload.status === 'insufficient_evidence' && payload.answer !== 'No tengo evidencia suficiente en los documentos provistos') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'insufficient_evidence debe usar el mensaje exacto definido por producto'
      });
    }
  });

export const draftOutputSchema = z.object({
  status: z.enum(['ready_for_review', 'insufficient_evidence']),
  title: z.string().min(1),
  draft: z.string().min(1),
  citations: z.array(citationSchema)
});

export const queryInputSchema = z.object({
  query: z.string().min(8),
  tenantId: z.string().uuid().optional()
});


export const evidenceOutputJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['status', 'answer', 'citations'],
  properties: {
    status: { type: 'string', enum: ['ok', 'insufficient_evidence'] },
    answer: { type: 'string' },
    citations: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['document_id', 'document_version', 'section', 'page_or_chunk', 'quote'],
        properties: {
          document_id: { type: 'string' },
          document_version: { type: 'string' },
          section: { type: 'string' },
          page_or_chunk: { type: 'string' },
          quote: { type: 'string' }
        }
      }
    }
  }
} as const;

export const draftOutputJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['status', 'title', 'draft', 'citations'],
  properties: {
    status: { type: 'string', enum: ['ready_for_review', 'insufficient_evidence'] },
    title: { type: 'string' },
    draft: { type: 'string' },
    citations: evidenceOutputJsonSchema.properties.citations
  }
} as const;
