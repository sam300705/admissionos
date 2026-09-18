import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Core CRM audit triggers", () => {
  it("records enquiry and follow-up lifecycle events in the database", () => {
    const sql = readFileSync(
      "supabase/migrations/20260918_core_crm_audit_triggers.sql",
      "utf8",
    );
    expect(sql).toMatch(/enquiry_audit_after_change/i);
    expect(sql).toMatch(/status_changed/i);
    expect(sql).toMatch(/assignment_changed/i);
    expect(sql).toMatch(/follow_up_scheduled/i);
    expect(sql).toMatch(/follow_up_completed/i);
    expect(sql).toMatch(/security definer/i);
  });
});
