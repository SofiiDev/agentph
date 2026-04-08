import { getServerEnv } from './env';

export const getSupabaseAdminClient = () => {
  const env = getServerEnv();

  const headers = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
  };

  return {
    getHeaders: () => headers,
    getUrl: () => env.SUPABASE_URL
  };
};
