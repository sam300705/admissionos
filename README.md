# AdmissionOS

AdmissionOS is a multi-tenant admissions CRM for coaching institutes and training teams. The product roadmap covers enquiry management, admissions, fees, follow-ups, reporting, team permissions, SaaS plans, and production hardening.

## Verified Phase 1 foundation

The current `phase-1-foundation` branch replaces the original public demo-only foundation with:

- Supabase Auth using cookie-backed SSR clients
- Email/password sign-up, sign-in, sign-out, password reset, and PKCE callback handling
- Institute onboarding with authenticated ownership derived on the server
- Multi-tenant PostgreSQL tables for profiles, institutes, and memberships
- Row Level Security on every Phase 1 tenant table
- Owner/admin/counsellor/finance RBAC with centralized permissions
- Protected dashboard routing based on verified auth claims and active membership
- Reproducible SQL migration under `supabase/migrations/`
- Pinned npm dependencies and committed lockfile
- CI gates for TypeScript, ESLint, Vitest, and production Next.js build

The student records visible on the dashboard are explicitly **demo presentation data** until Phase 2 connects courses, enquiries, activities, assignments, and follow-ups to Supabase.

## Database source of truth

Use:

```
supabase/migrations/20260917_foundation.sql
```

Do not create tables from ad-hoc SQL files. Future schema changes must be additive migrations under `supabase/migrations/`.

The migration creates:

- `profiles`
- `institutes`
- `institute_memberships`
- private helper functions and triggers
- membership-backed RLS policies
- authenticated grants only

Institute creation is atomic: the authenticated caller inserts an institute with `created_by = auth.uid()`; a private database trigger creates the active owner membership.

## Environment

Copy `.env.example` to `.env.local` and use a **dedicated AdmissionOS Supabase project**:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_replace_me
```

No service-role key is required by the Phase 1 application.

## Local verification

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

Run locally with:

```bash
npm run dev
```

## Authentication flow

- Anonymous users are sent to `/sign-in`.
- Authenticated users without an active institute membership are sent to `/onboarding`.
- Active members are sent to `/dashboard`.
- Authorization beyond route access uses `lib/permissions/permissions.ts` and server guards.
- Tenant isolation is enforced again at the database layer with RLS.

## Roadmap

- Phase 2: courses, enquiries, assignment, statuses, lead detail, activities, follow-ups
- Phase 3: admissions, fee schedules, instalments, payments, balances, receipts
- Phase 4: dashboard/reporting, CSV import/export, notifications, public forms, team management
- Phase 5: plans, trials, entitlements, billing architecture, platform admin, pricing/marketing
- Phase 6: security hardening, rate limits, audit logs, headers, cross-tenant and permission tests
- Phase 7: unit/integration/E2E QA and production build gates
- Phase 8: Vercel readiness, production environment docs, migrations, health endpoint, release docs

## Deployment status

The code is CI-verified, but a dedicated AdmissionOS Supabase project has not yet been provisioned through the connected account. Do not point this app at the existing CourseOS database. Production deployment is completed only after a dedicated project receives the migrations and environment variables and the live auth/tenant flows are externally verified.
