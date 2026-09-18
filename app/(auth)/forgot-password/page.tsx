import Link from "next/link";
import { requestPasswordReset } from "../../../lib/auth/actions";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <main className="authShell">
      <section className="panel authPanel">
        <p className="eyebrow">ACCOUNT RECOVERY</p>
        <h1>Reset password</h1>
        <p className="authLead">We will email a secure password reset link.</p>
        {params.error ? <p className="authAlert error">{params.error}</p> : null}
        <form action={requestPasswordReset} className="authForm">
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <button className="primary full" type="submit">Send reset link</button>
        </form>
        <div className="authLinks">
          <Link href="/sign-in">Back to sign in</Link>
        </div>
      </section>
    </main>
  );
}
