import { z } from 'zod';

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1)
});

export type AppEnv = z.infer<typeof envSchema>;

export const getEnv = (): AppEnv => {
  return envSchema.parse(process.env);
};
