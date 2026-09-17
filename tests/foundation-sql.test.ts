import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = resolve(process.cwd(), "supabase/migrations/20260917_foundation.sql");
const sql = existsSync(migrationPath) ? readFileSync(migrationPath, "utf8") : "";

function normalized() {
  return sql.replace(/\s+/g, " ").toLowerCase();
}

describe("foundation database migration", () => {
  it("enables RLS on every exposed foundation table", () => {
    for (const table of ["profiles", "institutes", "institute_memberships"]) {
      expect(normalized()).toContain(`alter table public.${table} enable row level security`);
    }
  });

  it("revokes default API privileges before granting explicit authenticated access", () => {
    for (const table of ["profiles", "institutes", "institute_memberships"]) {
      expect(normalized()).toContain(`revoke all on table public.${table} from anon, authenticated`);
    }
    expect(normalized()).toMatch(/grant select,?\s*update on table public\.profiles to authenticated/);
    expect(normalized()).toMatch(/grant select,?\s*insert,?\s*update on table public\.institutes to authenticated/);
    expect(normalized()).toMatch(/grant select on table public\.institute_memberships to authenticated/);
  });

  it("uses authenticated policies and auth.uid tenant predicates", () => {
    expect(normalized()).toContain("to authenticated");
    expect(normalized()).toContain("(select auth.uid())");
    expect(normalized()).not.toContain("auth.role()");
  });

  it("keeps security-definer membership helpers in a private schema", () => {
    expect(normalized()).toContain("create schema if not exists private");
    expect(normalized()).toContain("private.active_institute_ids");
    expect(normalized()).toMatch(/security definer\s+set search_path = ''/);
    expect(normalized()).toMatch(/revoke execute on function private\.active_institute_ids\(\) from public/);
    expect(normalized()).not.toMatch(/create (or replace )?function public\.[\w_]+\([^)]*\)[\s\S]*?security definer/);
  });

  it("indexes membership lookups by user and institute", () => {
    expect(normalized()).toMatch(/create index [\w_]+ on public\.institute_memberships\s*\(user_id, institute_id\)/);
  });

  it("creates owner membership atomically through a private institute trigger", () => {
    expect(normalized()).toContain("private.create_owner_membership");
    expect(normalized()).toContain("after insert on public.institutes");
    expect(normalized()).toContain("new.created_by");
    expect(normalized()).toMatch(/with check\s*\(\s*\(select auth\.uid\(\)\) is not null[\s\S]*?created_by\s*=\s*\(select auth\.uid\(\)\)/);
  });
});
