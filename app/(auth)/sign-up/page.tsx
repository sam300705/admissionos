import Link from "next/link";
import { signUp } from "../../../lib/auth/actions";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function SignUpPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <main className="authShell">
      <section className="panel authPanel">
        <p className="eyebrow">ADMISSIONOS</p>
        <h1>Create account</h1>
        <p className="authLead">Start with one secure institute workspace.</p>
        {params.error ? <p className="authAlert error">{params.error}</p> : null}
        <form action={signUp} className="authForm">
          <label>
            Full name
            <input name="fullName" autoComplete="name" required />
          </label>
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={10}
              required
            />
          </label>
          <button className="primary full" type="submit">Create account</button>
        </form>
        <div className="authLinks">
          <span>Already have an account?</span>
          <Link href="/sign-in">Sign in</Link>
        </div>
      </section>
    </main>
  );
}
