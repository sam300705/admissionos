import { redirect } from "next/navigation";
import { requireUser, getActiveMembership } from "../../lib/auth/session";
import { createWorkspace } from "../../lib/onboarding/actions";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function OnboardingPage({ searchParams }: Props) {
  const user = await requireUser();
  const existingMembership = await getActiveMembership(user.id);

  if (existingMembership) {
    redirect("/dashboard");
  }

  const params = await searchParams;

  return (
    <main className="authShell">
      <section className="panel authPanel">
        <p className="eyebrow">WORKSPACE SETUP</p>
        <h1>Create your institute</h1>
        <p className="authLead">
          This creates your first tenant workspace and makes your signed-in account its owner.
        </p>
        {params.error ? <p className="authAlert error">{params.error}</p> : null}
        <form action={createWorkspace} className="authForm">
          <label>
            Institute name
            <input
              name="name"
              placeholder="Bright Path Academy"
              autoComplete="organization"
              required
            />
          </label>
          <label>
            Workspace slug
            <input
              name="slug"
              placeholder="bright-path-academy"
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              required
            />
          </label>
          <p className="authHint">
            Use lowercase letters, numbers, and hyphens only.
          </p>
          <button className="primary full" type="submit">
            Create workspace
          </button>
        </form>
      </section>
    </main>
  );
}
