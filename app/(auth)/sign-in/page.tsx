import Link from "next/link";
import { signIn } from "../../../lib/auth/actions";

type Props = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function SignInPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <main className="authShell">
      <section className="panel authPanel">
        <p className="eyebrow">ADMISSIONOS</p>
        <h1>Sign in</h1>
        <p className="authLead">Access your institute workspace securely.</p>
        {params.error ? <p className="authAlert error">{params.error}</p> : null}
        {params.message ? <p className="authAlert">{params.message}</p> : null}
        <form action={signIn} className="authForm">
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Password
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button className="primary full" type="submit">Sign in</button>
        </form>
        <div className="authLinks">
          <Link href="/forgot-password">Forgot password?</Link>
          <Link href="/sign-up">Create account</Link>
        </div>
      </section>
    </main>
  );
}
