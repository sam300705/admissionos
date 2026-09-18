import { z } from "zod";

const email = z.string().trim().email("Enter a valid email address");
const password = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .max(128, "Password must be 128 characters or fewer");

const signInSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(100),
  email,
  password,
});

const forgotPasswordSchema = z.object({ email });
const resetPasswordSchema = z.object({ password });

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;

export function parseSignInInput(input: unknown): SignInInput {
  return signInSchema.parse(input);
}

export function parseSignUpInput(input: unknown): SignUpInput {
  return signUpSchema.parse(input);
}

export function parseForgotPasswordInput(input: unknown) {
  return forgotPasswordSchema.parse(input);
}

export function parseResetPasswordInput(input: unknown) {
  return resetPasswordSchema.parse(input);
}

export function safeNextPath(value: string | null | undefined, fallback = "/dashboard") {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\r\n]/.test(value)
  ) {
    return fallback;
  }

  return value;
}
