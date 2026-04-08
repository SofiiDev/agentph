import { z } from 'zod';
import { getEnv } from './env';
import {
  draftOutputJsonSchema,
  draftOutputSchema,
  evidenceOutputJsonSchema,
  evidenceOutputSchema
} from '@/domain/schemas';
import { DRAFT_SYSTEM_PROMPT, EVIDENCE_SYSTEM_PROMPT } from '@/domain/prompts';

const callResponsesApi = async <T>(
  schema: z.ZodType<T>,
  jsonSchema: object,
  name: string,
  input: Array<{ role: string; content: string }>
) => {
  const env = getEnv();

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      input,
      text: {
        format: {
          type: 'json_schema',
          name,
          strict: true,
          schema: jsonSchema
        }
      }
    })
  });

  const payload = await response.json();
  const textValue = payload.output?.[0]?.content?.[0]?.text;
  return schema.parse(JSON.parse(textValue));
};

export const askEvidenceModel = async (query: string, retrievedContext: string) => {
  return callResponsesApi(evidenceOutputSchema, evidenceOutputJsonSchema, 'evidence_response', [
    { role: 'system', content: EVIDENCE_SYSTEM_PROMPT },
    { role: 'user', content: `Pregunta: ${query}\n\nretrieved_context:\n${retrievedContext}` }
  ]);
};

export const askDraftModel = async (instruction: string, retrievedContext: string) => {
  return callResponsesApi(draftOutputSchema, draftOutputJsonSchema, 'draft_response', [
    { role: 'system', content: DRAFT_SYSTEM_PROMPT },
    { role: 'user', content: `Instrucción de borrador: ${instruction}\n\nretrieved_context:\n${retrievedContext}` }
  ]);
};

export const embedText = async (input: string): Promise<number[]> => {
  const env = getEnv();
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model: 'text-embedding-3-small', input })
  });

  const payload = await response.json();
  return payload.data[0].embedding as number[];
};
