import { z } from 'zod';

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  JWT_SECRET: z.string().min(10),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive()
});

export type ServerEnv = z.infer<typeof envSchema>;

let cached: ServerEnv | null = null;

export const getServerEnv = (): ServerEnv => {
  if (cached) {
    return cached;
  }

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid server env: ${parsed.error.message}`);
  }

  cached = parsed.data;
  return cached;
};

// fail-fast al cargar módulo en backend
export const assertEnvLoaded = () => getServerEnv();
