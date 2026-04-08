import { z } from 'zod';

export const assistantResponseSchema = z.object({
  answer: z.string().min(1),
  citations: z.array(
    z.object({
      document_id: z.string().min(1),
      document_name: z.string().min(1),
      version: z.string().min(1),
      page_number: z.number().int().nullable(),
      section_ref: z.string().nullable(),
      chunk_id: z.string().min(1),
      support_level: z.enum(['direct', 'partial'])
    })
  ),
  unsupported_claims: z.array(z.string()),
  confidence: z.enum(['low', 'medium', 'high']),
  needs_human_review: z.boolean()
});

export type AssistantResponse = z.infer<typeof assistantResponseSchema>;

export const assistantResponseJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['answer', 'citations', 'unsupported_claims', 'confidence', 'needs_human_review'],
  properties: {
    answer: { type: 'string' },
    citations: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['document_id', 'document_name', 'version', 'page_number', 'section_ref', 'chunk_id', 'support_level'],
        properties: {
          document_id: { type: 'string' },
          document_name: { type: 'string' },
          version: { type: 'string' },
          page_number: { type: ['integer', 'null'] },
          section_ref: { type: ['string', 'null'] },
          chunk_id: { type: 'string' },
          support_level: { type: 'string', enum: ['direct', 'partial'] }
        }
      }
    },
    unsupported_claims: { type: 'array', items: { type: 'string' } },
    confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
    needs_human_review: { type: 'boolean' }
  }
} as const;

export const NO_EVIDENCE_MESSAGE = 'No tengo evidencia suficiente en los documentos provistos.';
