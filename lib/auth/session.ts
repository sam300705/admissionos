import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "../supabase/server";
import type { Role } from "../permissions/permissions";

export type AuthenticatedUser = {
  id: string;
  email?: string;
};

export type ActiveMembership = {
  id: string;
  userId: string;
  instituteId: string;
  role: Role;
  status: "active";
};

function isRole(value: unknown): value is Role {
  return (
    value === "owner" ||
    value === "admin" ||
    value === "counsellor" ||
    value === "finance"
  );
}

export async function getOptionalUser(): Promise<AuthenticatedUser | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    return null;
  }

  return {
    id: data.claims.sub,
    email: typeof data.claims.email === "string" ? data.claims.email : undefined,
  };
}

export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getOptionalUser();

  if (!user) {
    redirect("/sign-in");
  }

  return user;
}

export async function getActiveMembership(
  userId: string,
): Promise<ActiveMembership | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("institute_memberships")
    .select("id,user_id,institute_id,role,status")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to resolve active institute membership");
  }

  if (!data || !isRole(data.role) || data.status !== "active") {
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    instituteId: data.institute_id,
    role: data.role,
    status: "active",
  };
}

export async function requireActiveMembership(): Promise<{
  user: AuthenticatedUser;
  membership: ActiveMembership;
}> {
  const user = await requireUser();
  const membership = await getActiveMembership(user.id);

  if (!membership) {
    redirect("/onboarding");
  }

  return { user, membership };
}
