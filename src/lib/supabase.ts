import { getEnv } from './env';

type RpcResponse<T> = { data: T | null; error: { message: string } | null };

type InsertResponse = { error: { message: string } | null };

export const getServiceSupabase = () => {
  const env = getEnv();
  const headers = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
  };

  return {
    async rpc<T>(fn: string, payload: Record<string, unknown>): Promise<RpcResponse<T>> {
      const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/${fn}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        return { data: null, error: { message: await response.text() } };
      }

      const data = (await response.json()) as T;
      return { data, error: null };
    },

    from(table: string) {
      return {
        async insert(payload: unknown): Promise<InsertResponse> {
          const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}`, {
            method: 'POST',
            headers: { ...headers, Prefer: 'return=minimal' },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            return { error: { message: await response.text() } };
          }

          return { error: null };
        }
      };
    }
  };
};
