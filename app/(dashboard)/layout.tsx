import type { ReactNode } from "react";
import { requireActiveMembership } from "../../lib/auth/session";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  await requireActiveMembership();
  return children;
}
