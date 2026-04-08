import { getServerEnv } from './env';

type RestInsertOptions = {
  table: string;
  rows: unknown;
};

export const getSupabaseAdminClient = () => {
  const env = getServerEnv();
  const headers = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
  };

  const storageHeaders = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
  };

  return {
    async insert({ table, rows }: RestInsertOptions) {
      const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=representation' },
        body: JSON.stringify(rows)
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },

    async patch(table: string, filters: Record<string, string>, payload: Record<string, unknown>) {
      const query = new URLSearchParams(filters).toString();
      const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?${query}`, {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=representation' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },

    async select(table: string, filters: Record<string, string>) {
      const query = new URLSearchParams(filters).toString();
      const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?${query}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },

    async uploadPrivateObject(bucket: string, path: string, bytes: Buffer, mimeType: string) {
      const response = await fetch(`${env.SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
        method: 'POST',
        headers: {
          ...storageHeaders,
          'Content-Type': mimeType,
          'x-upsert': 'false'
        },
        body: bytes
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    }
  };
};
