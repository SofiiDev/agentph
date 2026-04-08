import { z } from 'zod';

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1)
});

const legacyServerEnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional()
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type LegacyServerEnv = z.infer<typeof legacyServerEnvSchema>;

export const getPublicEnv = (): PublicEnv => {
  const parsed = publicEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid public env: ${parsed.error.message}`);
  }

  return parsed.data;
};

// Compat para módulos legacy que importan getEnv desde src/lib/env.ts
export const getEnv = (): LegacyServerEnv => {
  const parsed = legacyServerEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid legacy server env: ${parsed.error.message}`);
  }

  return parsed.data;
};
