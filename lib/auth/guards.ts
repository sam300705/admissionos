import { redirect } from "next/navigation";
import {
  hasPermission,
  type Permission,
} from "../permissions/permissions";
import { requireActiveMembership } from "./session";

export async function requirePermission(permission: Permission) {
  const context = await requireActiveMembership();

  if (!hasPermission(context.membership.role, permission)) {
    redirect("/dashboard?error=permission");
  }

  return context;
}
