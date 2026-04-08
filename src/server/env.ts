import { z } from 'zod';

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  JWT_SECRET: z.string().min(10),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive(),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive(),
  CHUNK_SIZE_WORDS: z.coerce.number().int().positive(),
  CHUNK_OVERLAP_WORDS: z.coerce.number().int().nonnegative(),
  APP_BASE_URL: z.string().url().optional()
});

export type ServerEnv = z.infer<typeof envSchema>;

let cached: ServerEnv | null = null;

export const getServerEnv = (): ServerEnv => {
  if (cached) return cached;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid server env: ${parsed.error.message}`);
  }

  if (parsed.data.CHUNK_OVERLAP_WORDS >= parsed.data.CHUNK_SIZE_WORDS) {
    throw new Error('Invalid server env: CHUNK_OVERLAP_WORDS must be lower than CHUNK_SIZE_WORDS');
  }

  cached = parsed.data;
  return cached;
};

export const assertEnvLoaded = () => getServerEnv();
