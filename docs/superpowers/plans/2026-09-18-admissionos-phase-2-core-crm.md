# AdmissionOS Phase 2 — Core CRM

## Goal

Replace demo browser-state records with tenant-scoped Supabase-backed CRM workflows for courses, enquiries, assignments, activities, status changes, and follow-ups.

## Acceptance gates

- Every Core CRM table has `institute_id`, foreign keys, useful indexes, explicit authenticated grants, and RLS.
- Owners/admins can manage all enquiries in their institute.
- Counsellors can create enquiries and manage only enquiries assigned to themselves.
- Finance cannot mutate CRM enquiries.
- Course mutations require the centralized `courses.manage` permission.
- Enquiry status values are constrained in the database and validation layer.
- Activity history is append-only from application workflows.
- Follow-ups can be scheduled and completed with server-side authorization.
- Pages `/courses`, `/enquiries`, `/enquiries/[id]`, and `/follow-ups` are protected by the Phase 1 membership boundary.
- Dashboard metrics are read from Supabase, not seed/browser state.
- No form-provided institute ID, role, actor ID, or owner ID grants authority.
- CI must pass clean install, typecheck, lint, unit/static security tests, and production build.

## Tasks

1. Add Core CRM migration: courses, enquiries, activities, follow-ups, indexes, triggers, RLS, grants.
2. Add pure validation and enquiry authorization helpers with tests.
3. Add tenant-scoped query layer.
4. Add server actions for course/enquiry/status/note/follow-up workflows.
5. Replace demo dashboard shell with protected real CRM pages.
6. Run Phase 2 security/release audit and verify full CI.
