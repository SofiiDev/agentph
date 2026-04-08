import { getPublicEnv } from './env';

type RpcResponse<T> = { data: T | null; error: { message: string } | null };

type InsertResponse = { error: { message: string } | null };

const buildClient = (url: string, apiKey: string) => {
  const headers = {
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };

  return {
    async rpc<T>(fn: string, payload: Record<string, unknown>): Promise<RpcResponse<T>> {
      const response = await fetch(`${url}/rest/v1/rpc/${fn}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        return { data: null, error: { message: await response.text() } };
      }

      return { data: (await response.json()) as T, error: null };
    },
    from(table: string) {
      return {
        async insert(payload: unknown): Promise<InsertResponse> {
          const response = await fetch(`${url}/rest/v1/${table}`, {
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

export const getSupabaseClientConfig = () => {
  const env = getPublicEnv();
  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  };
};

export const getAnonSupabase = () => {
  const env = getPublicEnv();
  return buildClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
};

// Compat export para código legacy server-side.
// Usa service role solo si está disponible en entorno backend.
export const getServiceSupabase = () => {
  const publicEnv = getPublicEnv();
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRole) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no disponible en este entorno');
  }

  return buildClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, serviceRole);
};
