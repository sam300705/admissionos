# AdmissionOS Phase 1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the demo-only foundation with real Supabase authentication, PostgreSQL migrations, membership-based multi-tenancy, RLS, centralized RBAC, protected routes, and a verified production build.

**Architecture:** Next.js App Router remains the application layer. Supabase provides Auth and PostgreSQL; authenticated server clients use cookie-backed sessions and RLS, while application authorization resolves an active institute membership and a centralized permission map. The existing dashboard UI is preserved behind authentication and remains explicitly demo-only until Phase 2 replaces its data layer.

**Tech Stack:** Next.js 15.5, React 19.1, TypeScript 5.8, Supabase PostgreSQL/Auth, `@supabase/supabase-js`, `@supabase/ssr`, Zod, Vitest, ESLint.

**Spec:** `docs/superpowers/specs/2026-09-17-admissionos-phase-1-foundation-design.md`

## Global Constraints

- Foundation only: no enquiry CRUD, finance, billing, reporting, AI, WhatsApp API, or cosmetic redesign.
- Membership is the authoritative tenant scope; client-provided institute IDs never grant access.
- RLS must protect every tenant-owned table introduced in this phase.
- No service-role key may appear in browser code.
- Use server-side authorization for protected operations.
- Use reproducible migrations under `supabase/migrations/`.
- Do not suppress TypeScript, lint, or test failures.
- Pin dependency versions and commit the lockfile.
- Do not move to Phase 2 until all Phase 1 acceptance gates pass.

---

## File Map

Create or modify the following focused boundaries:

- `package.json` — scripts and pinned dependencies.
- `package-lock.json` — reproducible dependency graph.
- `.env.example` — public Supabase placeholders only plus optional clearly server-only key placeholder.
- `lib/env.ts` — runtime environment validation.
- `lib/permissions/permissions.ts` — role and permission vocabulary plus pure permission helpers.
- `lib/supabase/client.ts` — browser Supabase client.
- `lib/supabase/server.ts` — cookie-backed server Supabase client.
- `lib/supabase/proxy.ts` — session refresh/protected-route support.
- `lib/auth/session.ts` — authenticated user and membership resolution.
- `lib/auth/guards.ts` — permission guards.
- `lib/auth/actions.ts` — sign-in/sign-up/sign-out/reset actions.
- `lib/onboarding/actions.ts` — secure workspace creation action.
- `app/(auth)/sign-in/page.tsx` — login page.
- `app/(auth)/sign-up/page.tsx` — registration page.
- `app/(auth)/forgot-password/page.tsx` — reset request page.
- `app/(auth)/reset-password/page.tsx` — password update page.
- `app/auth/callback/route.ts` — PKCE/code exchange callback.
- `app/onboarding/page.tsx` — minimal institute creation screen.
- `app/(dashboard)/dashboard/page.tsx` — protected dashboard entry.
- `app/(dashboard)/layout.tsx` — protected membership boundary.
- `app/page.tsx` — public entry/redirect rather than demo app root.
- `components/dashboard/demo-dashboard.tsx` — existing demo presentation moved out of `app/page.tsx`.
- `proxy.ts` — Next.js request/session proxy if required by current Supabase SSR convention.
- `supabase/migrations/20260917_foundation.sql` — profiles, institutes, memberships, RLS, grants, trigger/function support.
- `tests/permissions.test.ts` — pure RBAC behavior.
- `tests/env.test.ts` — environment validation behavior.
- `tests/foundation-sql.test.ts` — migration security invariants as a fast static guard.
- `vitest.config.ts` — test configuration.
- `eslint.config.mjs` — Next/TypeScript lint setup.

---

### Task 1: Tooling, scripts, and environment validation

**Files:**
- Modify: `package.json`
- Create/update: `package-lock.json`
- Modify: `.env.example`
- Create: `lib/env.ts`
- Create: `tests/env.test.ts`
- Create: `vitest.config.ts`
- Create: `eslint.config.mjs`

**Interfaces:**
- Produces `readPublicEnv(source)` returning validated `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Produces npm scripts `lint`, `test`, and keeps `typecheck`, `build`, `dev`, `start`.

- [ ] **Step 1: Write failing environment tests**

```ts
import { describe, expect, it } from 'vitest';
import { readPublicEnv } from '../lib/env';

describe('readPublicEnv', () => {
  it('rejects missing Supabase configuration', () => {
    expect(() => readPublicEnv({})).toThrow(/Supabase/i);
  });

  it('accepts a valid https URL and publishable key', () => {
    expect(readPublicEnv({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
    })).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
    });
  });
});
```

- [ ] **Step 2: Install pinned dependencies and run the test to confirm RED**

Run `npm install --save-exact @supabase/supabase-js @supabase/ssr zod` and `npm install --save-dev --save-exact vitest eslint eslint-config-next`.

Run `npm test -- tests/env.test.ts` and confirm failure because `lib/env.ts` does not exist.

- [ ] **Step 3: Implement `lib/env.ts` minimally**

Use Zod to require an HTTPS Supabase URL and a non-empty publishable key. Keep the parser injectable so tests never depend on process globals.

- [ ] **Step 4: Add scripts/config and verify GREEN**

Use `vitest run` for `npm test`; add `next lint` equivalent through ESLint CLI appropriate for Next 15; run the env test and `npm run typecheck`.

- [ ] **Step 5: Commit**

Commit message: `chore: add foundation tooling and environment validation`.

---

### Task 2: Centralized RBAC

**Files:**
- Create: `lib/permissions/permissions.ts`
- Create: `tests/permissions.test.ts`

**Interfaces:**
- Produces `Role = 'owner' | 'admin' | 'counsellor' | 'finance'`.
- Produces `Permission` union and `hasPermission(role, permission): boolean`.

- [ ] **Step 1: Write failing permission tests**

Tests must prove owner can manage workspace, counsellor cannot, finance can read/manage finance but cannot manage members, and admin can manage members/courses/enquiries but not billing ownership.

- [ ] **Step 2: Run the permission test and confirm RED**

Run `npm test -- tests/permissions.test.ts`.

- [ ] **Step 3: Implement the smallest explicit permission map**

Use immutable sets per role. Do not infer permissions from numeric role ordering.

- [ ] **Step 4: Run test suite and typecheck**

Run `npm test -- tests/permissions.test.ts` then `npm run typecheck`.

- [ ] **Step 5: Commit**

Commit message: `feat(auth): add centralized role permissions`.

---

### Task 3: Supabase foundation migration and RLS

**Files:**
- Create: `supabase/migrations/20260917_foundation.sql`
- Create: `tests/foundation-sql.test.ts`

**Interfaces:**
- Produces tables `profiles`, `institutes`, `institute_memberships`.
- Produces active-membership-backed RLS policies.
- Produces a safe profile synchronization trigger for new auth users.
- Produces an authenticated workspace-creation function or equivalent atomic database operation that derives `auth.uid()` internally.

- [ ] **Step 1: Write failing migration-invariant tests**

Read the migration as text and assert it contains RLS enabling for all three public tables, explicit authenticated grants, no `auth.role()` checks, no public service-role secret, an index beginning with `user_id` on memberships, and tenant access predicates derived from `auth.uid()`.

- [ ] **Step 2: Run the migration test and confirm RED**

Run `npm test -- tests/foundation-sql.test.ts`.

- [ ] **Step 3: Write the migration**

Create enums/checks for roles/status, profile FK to `auth.users`, unique institute slug, unique `(institute_id,user_id)` membership, membership indexes, `updated_at` trigger support, RLS and explicit grants. Keep any `SECURITY DEFINER` function in a non-exposed private schema, revoke PUBLIC execute, set `search_path=''`, derive caller with `(select auth.uid())`, and grant only required execution to `authenticated`.

- [ ] **Step 4: Verify static tests and review against current Supabase RLS rules**

Run `npm test -- tests/foundation-sql.test.ts`. Confirm UPDATE policies include both `USING` and `WITH CHECK` and that anon receives no tenant-table privileges.

- [ ] **Step 5: Commit**

Commit message: `feat(db): add multi-tenant foundation migration`.

---

### Task 4: Supabase browser/server clients and session refresh

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/proxy.ts`
- Create: `proxy.ts`

**Interfaces:**
- Produces `createBrowserSupabaseClient()`.
- Produces async `createServerSupabaseClient()` using Next cookies.
- Produces request session-refresh helper used by root proxy.

- [ ] **Step 1: Add tests for pure configuration where possible**

Test that public environment parsing is the only source of URL/key and service-role variables are never imported by browser code. Use import/static checks rather than mocking Next internals.

- [ ] **Step 2: Confirm RED**

Run targeted tests.

- [ ] **Step 3: Implement clients using the current `@supabase/ssr` API**

Use cookie-backed SSR. Do not use deprecated auth helpers. The root request proxy refreshes auth cookies and does not implement application authorization itself.

- [ ] **Step 4: Run test/typecheck**

Run `npm test` and `npm run typecheck`.

- [ ] **Step 5: Commit**

Commit message: `feat(auth): add Supabase SSR clients`.

---

### Task 5: Auth actions and pages

**Files:**
- Create: `lib/auth/actions.ts`
- Create: `app/(auth)/sign-in/page.tsx`
- Create: `app/(auth)/sign-up/page.tsx`
- Create: `app/(auth)/forgot-password/page.tsx`
- Create: `app/(auth)/reset-password/page.tsx`
- Create: `app/auth/callback/route.ts`

**Interfaces:**
- Server actions return typed user-safe errors or redirect on success.
- Callback exchanges auth code then redirects to onboarding/dashboard resolution.

- [ ] **Step 1: Add validation tests for auth input schemas**

Prove malformed email and short password are rejected before calling Supabase.

- [ ] **Step 2: Confirm RED**

Run auth validation tests.

- [ ] **Step 3: Implement actions/pages**

Use server actions and Supabase Auth. Password reset redirect must target `/auth/callback?next=/reset-password`. Sanitize `next` to local paths only.

- [ ] **Step 4: Run tests, lint, typecheck**

Run `npm test`, `npm run lint`, `npm run typecheck`.

- [ ] **Step 5: Commit**

Commit message: `feat(auth): add authentication flows`.

---

### Task 6: Membership resolution, guards, and protected dashboard

**Files:**
- Create: `lib/auth/session.ts`
- Create: `lib/auth/guards.ts`
- Create: `app/(dashboard)/layout.tsx`
- Create: `app/(dashboard)/dashboard/page.tsx`
- Create: `components/dashboard/demo-dashboard.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Produces `requireUser()`.
- Produces `getActiveMembership(userId)`.
- Produces `requireActiveMembership()`.
- Produces `requirePermission(permission)`.

- [ ] **Step 1: Write pure guard tests around permission decisions and route-resolution decisions**

Model three states: anonymous -> sign-in; authenticated without membership -> onboarding; authenticated active member -> dashboard.

- [ ] **Step 2: Confirm RED**

Run targeted tests.

- [ ] **Step 3: Implement guards and protected route group**

Resolve membership server-side from authenticated identity. Move the existing demo dashboard into a component displayed only after the protected layout. Label its records as demo/presentation data until Phase 2.

- [ ] **Step 4: Run tests/typecheck/lint**

Run `npm test`, `npm run typecheck`, `npm run lint`.

- [ ] **Step 5: Commit**

Commit message: `feat(auth): protect dashboard with institute membership`.

---

### Task 7: Atomic onboarding workspace creation

**Files:**
- Create: `lib/onboarding/actions.ts`
- Create: `app/onboarding/page.tsx`
- Extend tests for slug/input validation and onboarding route decision.

**Interfaces:**
- Produces validated `createWorkspace` server action.
- Database operation derives user ID from authenticated session and atomically creates institute plus owner membership.

- [ ] **Step 1: Write failing validation/authorization tests**

Prove empty name, invalid slug, and unauthenticated creation are rejected.

- [ ] **Step 2: Confirm RED**

Run targeted onboarding tests.

- [ ] **Step 3: Implement onboarding page/action**

Server action must never accept role or owner user ID from form input. Handle duplicate slug as a safe user-facing conflict.

- [ ] **Step 4: Run full automated checks**

Run `npm test`, `npm run typecheck`, `npm run lint`.

- [ ] **Step 5: Commit**

Commit message: `feat(onboarding): add atomic institute workspace creation`.

---

### Task 8: Phase 1 integration verification and documentation

**Files:**
- Modify: `.env.example`
- Modify: `README.md`
- Modify any foundation files only to fix verification failures.

**Interfaces:**
- No new product behavior; this task proves the phase.

- [ ] **Step 1: Verify clean dependency installation**

Delete generated install state in the isolated workspace as appropriate and run `npm ci` from the committed lockfile.

- [ ] **Step 2: Run quality gates**

Run, in order:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

All must exit 0.

- [ ] **Step 3: Verify database security on a dedicated AdmissionOS Supabase environment**

Apply the migration to an AdmissionOS-only Supabase project or isolated branch. Create two authenticated test identities/workspaces and prove cross-tenant reads and updates are denied under RLS. Run Supabase security and performance advisors and fix foundation findings.

Do not reuse or mutate an unrelated product database such as CourseOS.

- [ ] **Step 4: Verify auth workflow against the dedicated environment**

Prove sign-up/sign-in, no-membership onboarding, workspace creation, protected dashboard access, sign-out, and persistence across a new session.

- [ ] **Step 5: Update README accurately**

Document setup, environment variables, migrations, auth/tenant architecture, test commands, and the fact that the dashboard records remain demo presentation data until Phase 2.

- [ ] **Step 6: Final acceptance review**

Check all 14 acceptance items from the design spec. Phase 2 begins only if every locally verifiable check is green and dedicated Supabase verification is complete.

- [ ] **Step 7: Commit**

Commit message: `docs: verify AdmissionOS phase 1 foundation`.
