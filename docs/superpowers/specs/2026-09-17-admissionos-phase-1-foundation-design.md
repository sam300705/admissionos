# AdmissionOS Phase 1 Foundation Design

Date: 2026-09-17
Branch: `phase-1-foundation`
Scope: Foundation only. No CRM, finance, billing, AI, reporting, or cosmetic redesign work is included in this phase except where required to prove the foundation works.

## Goal

Replace the current demo-only architectural foundation with a production-oriented base that supports real authentication, persistent PostgreSQL data, institute workspaces, multi-tenant isolation, role-based authorization, reproducible migrations, and protected application routes.

Phase 1 is complete only when these controls are implemented and verified. The next phase must not start while a foundation acceptance check is failing.

## Current State

The repository currently has a Next.js App Router frontend, TypeScript, a polished admissions dashboard, browser-state demo data, and a standalone PostgreSQL schema. The application does not yet have real authentication, database persistence, tenant isolation, RLS, server-side RBAC, or a migration workflow.

The existing dashboard is treated as presentation work worth preserving, not as the production data architecture.

## Architectural Decision

Use Supabase for:

- PostgreSQL
- Auth
- Row Level Security

Keep Next.js as the application layer and use server-first data access.

Sensitive operations must pass both:

1. database-level tenant isolation through RLS; and
2. server-side authorization based on authenticated membership and permissions.

The browser must never be trusted to decide its own institute, role, or authorization scope.

## Tenant Model

Use membership-based tenancy rather than tying a user directly to one institute.

Core entities for this phase:

### `profiles`

Application profile mapped 1:1 to the authenticated Supabase user.

Key fields:

- `id` -> auth user UUID
- `full_name`
- `created_at`
- `updated_at`

### `institutes`

Represents a customer workspace.

Key fields:

- `id`
- `name`
- `slug`
- `email`
- `phone`
- `country`
- `timezone`
- `currency`
- `created_at`
- `updated_at`

Default operational assumptions for the first production version:

- country: India
- timezone: Asia/Kolkata
- currency: INR

### `institute_memberships`

Maps users to institute workspaces.

Key fields:

- `id`
- `user_id`
- `institute_id`
- `role`
- `status`
- `invited_by`
- `joined_at`
- `created_at`

Roles:

- `owner`
- `admin`
- `counsellor`
- `finance`

Statuses:

- `active`
- `invited`
- `disabled`

Membership is the authoritative source for tenant access. A client-provided `institute_id` never grants access by itself.

## Authentication

Implement Supabase Auth support for:

- sign up
- sign in
- sign out
- password reset request
- password reset completion
- session restoration
- server-side session checks

Email verification behavior should use Supabase configuration and should not be reimplemented manually.

Protected application routes must reject anonymous users.

Authenticated users who do not yet belong to an active institute must be routed to onboarding instead of the dashboard.

## Onboarding Boundary

Phase 1 includes only the minimum onboarding needed to create a valid workspace:

1. authenticated owner creates an institute;
2. owner membership is created atomically;
3. user is redirected into the protected dashboard shell.

Course creation, staff invitations, CSV imports, and onboarding checklists belong to later phases.

## Authorization Model

Create centralized permission definitions rather than scattered role comparisons.

Suggested permission vocabulary for future growth:

- `institute.read`
- `institute.update`
- `members.read`
- `members.manage`
- `courses.read`
- `courses.manage`
- `enquiries.read`
- `enquiries.manage_all`
- `enquiries.manage_assigned`
- `finance.read`
- `finance.manage`
- `reports.read`
- `billing.manage`

Phase 1 only needs enough permissions to prove the RBAC framework. Later phases extend the same map.

Server utilities should expose concepts similar to:

- get authenticated user
- get active institute membership
- require authenticated user
- require institute membership
- require permission

No protected mutation should depend only on UI visibility.

## Row Level Security

Enable RLS for all tenant-owned tables introduced in this phase.

Policies must ensure:

- authenticated users can read their own profile;
- authenticated users can read institutes only through active membership;
- users can read their own active memberships;
- institute-owned data is visible only to members of that institute;
- creating an institute uses a secure server-side flow that also creates the owner membership;
- unauthorized cross-tenant reads and writes fail even if a caller directly targets table APIs.

A service-role key must never be exposed to the browser.

If service-role access is required for a tightly controlled server operation, it must stay in server-only code and the operation must perform its own authorization first.

## Database Migrations

Replace the repository's single-schema-file-only approach with reproducible migrations under:

`supabase/migrations/`

The initial foundation migration should establish:

- required extensions
- enums or check constraints
- `profiles`
- `institutes`
- `institute_memberships`
- timestamps
- foreign keys
- unique constraints
- indexes
- RLS policies
- helper functions only where justified

The existing `db/schema.sql` may remain temporarily as historical/reference material, but migrations become the source of truth.

Do not mix development seed data into production migrations.

## Environment Configuration

Introduce validated environment configuration.

Expected public values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Expected server-only values only if actually required:

- `SUPABASE_SERVICE_ROLE_KEY`

Do not require server-role access if normal authenticated/RLS-aware operations are sufficient.

Update `.env.example` with placeholders only.

Add a startup/build-time validation path so missing required environment variables fail with a clear message instead of causing obscure runtime errors.

## Next.js Integration

Use separate Supabase clients for browser and server contexts.

Server Components and Route Handlers/Server Actions should use the authenticated server client for protected data access.

Add middleware/session-refresh handling only where required by the current Supabase SSR approach.

Protected routes should live under an authenticated route group or equivalent clear boundary.

The existing dashboard UI should be moved behind authentication but may continue showing explicitly labeled demo presentation data until Phase 2 replaces the CRM layer. It must not pretend that the demo records are persisted production records.

## Error Handling

Foundation-specific errors must distinguish at least:

- unauthenticated
- no active institute membership
- unauthorized permission
- invalid input
- duplicate institute slug
- database failure

Do not expose raw database errors or stack traces in normal UI messages.

## Testing Strategy

Use TDD for foundation logic.

Required tests before Phase 1 can be marked complete:

### Authentication boundary

- anonymous user cannot access protected dashboard
- authenticated user without membership is directed to onboarding
- authenticated member can access dashboard shell

### Tenant isolation

Create Institute A and Institute B test fixtures.

Verify:

- A cannot read B's institute-owned data
- A cannot update B's institute-owned data
- B cannot read A's data
- direct database/API-style access is still denied by RLS

### RBAC

Verify centralized permissions, including examples such as:

- owner has workspace-management permission
- counsellor lacks workspace-management permission
- finance does not implicitly gain owner permission

### Onboarding

Verify institute creation plus owner membership is atomic from the application's perspective.

A failed membership creation must not leave a usable orphaned workspace path.

## Build and Quality Gates

Phase 1 cannot complete until the repository has working scripts for relevant checks and the following pass:

- install
- typecheck
- lint
- tests
- production build

Do not suppress TypeScript or lint errors simply to make the checks green.

## Security Constraints

Non-negotiable:

- no service-role credential in browser code
- no trusting role/institute IDs from form payloads
- no protected data fetch based solely on URL IDs
- no cross-tenant fallback behavior
- no unauthenticated protected page rendering
- no fake login state
- no localStorage-based production auth
- no committed real credentials

## File/Module Direction

Exact names may evolve during implementation, but the intended boundaries are:

- `lib/supabase/client.ts` - browser client
- `lib/supabase/server.ts` - server client
- `lib/auth/*` - auth/session helpers
- `lib/permissions/*` - role/permission definitions and guards
- `lib/env.ts` - environment validation
- `app/(auth)/*` - sign in/up/reset flows
- `app/onboarding/*` - minimal workspace creation
- `app/(dashboard)/*` - protected application shell
- `supabase/migrations/*` - database source of truth
- `tests/*` - permission/tenancy/foundation tests

Avoid giant modules and keep authorization independent from UI components.

## Data Flow

### Sign up

User submits credentials
-> Supabase Auth creates identity
-> profile is created/synchronized
-> if no institute membership exists, redirect to onboarding.

### Create workspace

Authenticated user submits institute details
-> server validates input
-> secure server/database operation creates institute
-> owner membership is created for the authenticated user
-> redirect to protected dashboard.

### Protected request

Request arrives
-> session is validated server-side
-> active institute membership is resolved
-> required permission is checked when necessary
-> database query executes under RLS
-> only tenant-authorized data is returned.

## Explicit Non-Goals for Phase 1

Do not implement yet:

- enquiry CRUD
- courses CRUD beyond any temporary technical fixture needed for a test
- follow-ups
- payments
- admissions
- reports
- CSV import/export
- staff invitation UX
- notifications
- billing
- platform admin
- WhatsApp API
- AI features
- marketing redesign

Those remain blocked until the foundation acceptance gate passes.

## Phase 1 Acceptance Gate

Phase 1 is considered verified only when all of the following are true:

1. A real Supabase-backed authentication path exists.
2. Protected dashboard routes reject anonymous users.
3. A signed-in user without a workspace reaches onboarding.
4. Workspace creation creates an owner membership.
5. Membership is the source of tenant scope.
6. RLS is enabled and tested for cross-tenant denial.
7. RBAC permissions are centralized and server-enforced.
8. Database state is reproducible from migrations.
9. Required environment variables are validated and documented.
10. Typecheck passes.
11. Lint passes.
12. Foundation tests pass.
13. Production build passes.
14. No real secrets are committed.

Only after all acceptance checks are green should implementation move to Phase 2: Core CRM.