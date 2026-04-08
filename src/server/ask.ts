import { AppError } from './errors';
import { getServerEnv } from './env';
import { searchRelevantChunks } from './search';
import { assistantResponseJsonSchema, assistantResponseSchema, NO_EVIDENCE_MESSAGE, type AssistantResponse } from './ask-schema';
import { getSupabaseAdminClient } from './supabase-admin';
import { log } from './logger';

type AskParams = {
  organizationId: string;
  userId: string;
  question: string;
  topK?: number;
  onlyApproved?: boolean;
};

const buildRetrievedContext = (rows: Awaited<ReturnType<typeof searchRelevantChunks>>) =>
  rows
    .map(
      (row) =>
        `[chunk_id:${row.chunk_id}] [document_id:${row.document_id}] [document_name:${row.document_name}] [version:${row.document_version}] [page:${row.page_number ?? '-'}] [section:${row.section_ref ?? '-'}] [status:${row.status}]\n${row.content}`
    )
    .join('\n\n');

const validateCitationIntegrity = (response: AssistantResponse, retrieved: Awaited<ReturnType<typeof searchRelevantChunks>>) => {
  const allowedChunkIds = new Set(retrieved.map((r) => r.chunk_id));
  for (const citation of response.citations) {
    if (!allowedChunkIds.has(citation.chunk_id)) {
      throw new AppError('INVALID_CITATION', 'El modelo devolvió una cita fuera del contexto recuperado', 422, {
        chunk_id: citation.chunk_id
      });
    }
  }

  if (response.answer !== NO_EVIDENCE_MESSAGE && response.citations.length === 0) {
    throw new AppError('UNSUPPORTED_ANSWER', 'Toda afirmación debe incluir citas', 422);
  }
};

const callModel = async (question: string, retrievedContext: string): Promise<AssistantResponse> => {
  const env = getServerEnv();

  const systemPrompt = [
    'Eres un asistente regulatorio farmacéutico privado.',
    'Reglas obligatorias:',
    '1) Solo puedes usar retrieved_context.',
    '2) No uses conocimiento externo.',
    '3) No inventes referencias ni requisitos.',
    '4) Toda afirmación debe estar soportada por al menos una cita.',
    `5) Si no hay soporte suficiente responde exactamente: ${NO_EVIDENCE_MESSAGE}`
  ].join('\n');

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `question:\n${question}\n\nretrieved_context:\n${retrievedContext}` }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'assistant_response',
          strict: true,
          schema: assistantResponseJsonSchema
        }
      }
    })
  });

  if (!response.ok) {
    throw new AppError('MODEL_ERROR', `Error llamando al modelo: ${await response.text()}`, 502);
  }

  const payload = await response.json();
  const text = payload.output?.[0]?.content?.[0]?.text;
  try {
    return assistantResponseSchema.parse(JSON.parse(text));
  } catch {
    throw new AppError('INVALID_MODEL_JSON', 'El modelo devolvió JSON inválido', 502);
  }
};

export const askRegulatoryQuestion = async (params: AskParams): Promise<AssistantResponse> => {
  const supabase = getSupabaseAdminClient();

  const retrieved = await searchRelevantChunks(params.question, {
    organizationId: params.organizationId,
    topK: params.topK ?? 8,
    onlyApproved: params.onlyApproved ?? true,
    currentOnly: true,
    includeObsolete: false
  });

  if (retrieved.length === 0) {
    const noEvidence: AssistantResponse = {
      answer: NO_EVIDENCE_MESSAGE,
      citations: [],
      unsupported_claims: [params.question],
      confidence: 'low',
      needs_human_review: true
    };

    await supabase.insert({
      table: 'query_logs',
      rows: {
        organization_id: params.organizationId,
        user_id: params.userId,
        query_text: params.question,
        filters: { onlyApproved: params.onlyApproved ?? true },
        result_count: 0
      }
    });

    return noEvidence;
  }

  try {
    const result = await callModel(params.question, buildRetrievedContext(retrieved));
    validateCitationIntegrity(result, retrieved);

    await supabase.insert({
      table: 'query_logs',
      rows: {
        organization_id: params.organizationId,
        user_id: params.userId,
        query_text: params.question,
        filters: { topK: params.topK ?? 8, onlyApproved: params.onlyApproved ?? true },
        result_count: result.citations.length
      }
    });

    await supabase.insert({
      table: 'audit_logs',
      rows: {
        organization_id: params.organizationId,
        user_id: params.userId,
        entity_name: 'assistant_ask',
        action: 'ask_answered',
        metadata: {
          confidence: result.confidence,
          needs_human_review: result.needs_human_review,
          citation_count: result.citations.length
        }
      }
    });

    return result;
  } catch (error) {
    await supabase.insert({
      table: 'audit_logs',
      rows: {
        organization_id: params.organizationId,
        user_id: params.userId,
        entity_name: 'assistant_ask',
        action: 'ask_failed',
        metadata: {
          error: error instanceof Error ? error.message : String(error)
        }
      }
    });

    log('error', 'ask_failed', {
      organizationId: params.organizationId,
      error: error instanceof Error ? error.message : String(error)
    });

    throw error;
  }
};
