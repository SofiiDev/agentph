import { describe, expect, it } from 'vitest';
import { evidenceOutputSchema } from '@/domain/schemas';

describe('evidenceOutputSchema', () => {
  it('acepta insufficient_evidence con mensaje exacto', () => {
    const parsed = evidenceOutputSchema.safeParse({
      status: 'insufficient_evidence',
      answer: 'No tengo evidencia suficiente en los documentos provistos',
      citations: []
    });

    expect(parsed.success).toBe(true);
  });

  it('rechaza insufficient_evidence con mensaje distinto', () => {
    const parsed = evidenceOutputSchema.safeParse({
      status: 'insufficient_evidence',
      answer: 'No hay suficiente contexto',
      citations: []
    });

    expect(parsed.success).toBe(false);
  });
});
