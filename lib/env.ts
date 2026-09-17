import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string({ error: "Supabase URL is required" })
    .url("Supabase URL must be a valid URL")
    .refine((value) => value.startsWith("https://"), "Supabase URL must use https"),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string({ error: "Supabase publishable key is required" })
    .min(1, "Supabase publishable key is required"),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

export function readPublicEnv(source: Record<string, string | undefined>): PublicEnv {
  const result = publicEnvSchema.safeParse(source);

  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join("; ");
    throw new Error(`Invalid Supabase configuration: ${message}`);
  }

  return result.data;
}

export function getPublicEnv(): PublicEnv {
  return readPublicEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}
