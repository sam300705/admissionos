"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "../supabase/server";
import {
  parseForgotPasswordInput,
  parseResetPasswordInput,
  parseSignInInput,
  parseSignUpInput,
} from "./validation";

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

async function requestOrigin() {
  const requestHeaders = await headers();
  const directOrigin = requestHeaders.get("origin");

  if (directOrigin && /^https?:\/\//i.test(directOrigin)) {
    return directOrigin;
  }

  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");

  return `${protocol}://${host}`;
}

export async function signIn(formData: FormData) {
  let input;

  try {
    input = parseSignInInput({
      email: field(formData, "email"),
      password: field(formData, "password"),
    });
  } catch {
    redirectWithError("/sign-in", "Enter a valid email and password.");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword(input);

  if (error) {
    redirectWithError("/sign-in", "Email or password is incorrect.");
  }

  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  let input;

  try {
    input = parseSignUpInput({
      fullName: field(formData, "fullName"),
      email: field(formData, "email"),
      password: field(formData, "password"),
    });
  } catch {
    redirectWithError(
      "/sign-up",
      "Use a valid email, your full name, and a password of at least 10 characters.",
    );
  }

  const origin = await requestOrigin();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: { full_name: input.fullName },
      emailRedirectTo: `${origin}/auth/callback?next=/onboarding`,
    },
  });

  if (error) {
    redirectWithError("/sign-up", "We could not create that account.");
  }

  if (data.session) {
    redirect("/onboarding");
  }

  redirect(
    `/sign-in?message=${encodeURIComponent(
      "Check your email to confirm your account, then sign in.",
    )}`,
  );
}

export async function requestPasswordReset(formData: FormData) {
  let input;

  try {
    input = parseForgotPasswordInput({ email: field(formData, "email") });
  } catch {
    redirectWithError("/forgot-password", "Enter a valid email address.");
  }

  const origin = await requestOrigin();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    redirectWithError(
      "/forgot-password",
      "We could not send a reset email. Please try again.",
    );
  }

  redirect(
    `/sign-in?message=${encodeURIComponent(
      "If an account exists for that email, a reset link has been sent.",
    )}`,
  );
}

export async function resetPassword(formData: FormData) {
  let input;

  try {
    input = parseResetPasswordInput({ password: field(formData, "password") });
  } catch {
    redirectWithError(
      "/reset-password",
      "Use a password of at least 10 characters.",
    );
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.updateUser({ password: input.password });

  if (error) {
    redirectWithError(
      "/reset-password",
      "Your reset session is invalid or expired. Request another reset link.",
    );
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
