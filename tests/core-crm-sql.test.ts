import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migrationPath = "supabase/migrations/20260918_core_crm.sql";

describe("Core CRM migration security contract", () => {
  it("creates the four tenant-owned CRM tables with RLS", () => {
    expect(existsSync(migrationPath)).toBe(true);
    const sql = readFileSync(migrationPath, "utf8");

    for (const table of ["courses", "enquiries", "enquiry_activities", "follow_ups"]) {
      expect(sql).toMatch(new RegExp(`create table public\\.${table}\\b`, "i"));
      expect(sql).toMatch(
        new RegExp(`alter table public\\.${table} enable row level security`, "i"),
      );
    }
  });

  it("uses tenant-safe composite relationships and assignment fields", () => {
    const sql = readFileSync(migrationPath, "utf8");
    expect(sql).toMatch(/foreign key\s*\(course_id,\s*institute_id\)/i);
    expect(sql).toMatch(/foreign key\s*\(enquiry_id,\s*institute_id\)/i);
    expect(sql).toMatch(/assigned_to uuid/i);
    expect(sql).toMatch(/institute_id,\s*assigned_to/i);
  });

  it("constrains statuses and creates operational indexes", () => {
    const sql = readFileSync(migrationPath, "utf8");
    expect(sql).toMatch(/new_enquiry/i);
    expect(sql).toMatch(/demo_scheduled/i);
    expect(sql).toMatch(/scheduled[\s\S]*completed[\s\S]*cancelled/i);
    expect(sql).toMatch(/enquiries_institute_status_idx/i);
    expect(sql).toMatch(/follow_ups_institute_due_idx/i);
  });

  it("grants no CRM table privileges to anon and scopes writes by auth uid", () => {
    const sql = readFileSync(migrationPath, "utf8");
    expect(sql).toMatch(/revoke all on table public\.courses from anon/i);
    expect(sql).toMatch(/revoke all on table public\.enquiries from anon/i);
    expect(sql).toMatch(/auth\.uid\(\)/i);
    expect(sql).toMatch(/private\.can_manage_enquiry/i);
    expect(sql).not.toMatch(/auth\.role\(\)/i);
  });
});
