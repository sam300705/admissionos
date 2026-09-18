import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import { safeNextPath } from "../../../lib/auth/validation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));

  if (!code) {
    const signIn = new URL("/sign-in", url.origin);
    signIn.searchParams.set("error", "The authentication link is invalid or expired.");
    return NextResponse.redirect(signIn);
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const signIn = new URL("/sign-in", url.origin);
    signIn.searchParams.set("error", "The authentication link is invalid or expired.");
    return NextResponse.redirect(signIn);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
