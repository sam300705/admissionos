import { resetPassword } from "../../../lib/auth/actions";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <main className="authShell">
      <section className="panel authPanel">
        <p className="eyebrow">ACCOUNT SECURITY</p>
        <h1>Choose a new password</h1>
        <p className="authLead">Use at least 10 characters.</p>
        {params.error ? <p className="authAlert error">{params.error}</p> : null}
        <form action={resetPassword} className="authForm">
          <label>
            New password
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={10}
              required
            />
          </label>
          <button className="primary full" type="submit">Update password</button>
        </form>
      </section>
    </main>
  );
}
