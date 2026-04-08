import { z } from 'zod';

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1)
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

export const getPublicEnv = (): PublicEnv => {
  const parsed = publicEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid public env: ${parsed.error.message}`);
  }

  return parsed.data;
};
