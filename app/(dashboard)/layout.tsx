import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "../../lib/auth/actions";
import { requireActiveMembership } from "../../lib/auth/session";
import { createServerSupabaseClient } from "../../lib/supabase/server";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const { user, membership } = await requireActiveMembership();
  const supabase = await createServerSupabaseClient();
  const { data: institute } = await supabase
    .from("institutes")
    .select("name")
    .eq("id", membership.instituteId)
    .maybeSingle();

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandMark">AO</div>
          <div>
            <strong>AdmissionOS</strong>
            <span>Admissions CRM</span>
          </div>
        </div>
        <nav>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/enquiries">Enquiries</Link>
          <Link href="/follow-ups">Follow-ups</Link>
          <Link href="/courses">Courses</Link>
        </nav>
        <div className="sidebarMeta">
          <strong>{institute?.name ?? "Institute workspace"}</strong>
          <span>{membership.role}</span>
          <span>{user.email ?? "Authenticated user"}</span>
          <form action={signOut}>
            <button className="linkButton" type="submit">Sign out</button>
          </form>
        </div>
      </aside>
      <section className="workspace">{children}</section>
    </main>
  );
}
