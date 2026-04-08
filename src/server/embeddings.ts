import { getServerEnv } from './env';

export const createEmbedding = async (input: string): Promise<number[]> => {
  const env = getServerEnv();

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model: 'text-embedding-3-small', input })
  });

  if (!response.ok) {
    throw new Error(`Embedding request failed: ${await response.text()}`);
  }

  const payload = await response.json();
  return payload.data[0].embedding as number[];
};
