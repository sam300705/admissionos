import { describe, expect, it } from "vitest";
import { hasPermission, type Permission, type Role } from "../lib/permissions/permissions";

function expectPermissions(role: Role, allowed: Permission[], denied: Permission[]) {
  for (const permission of allowed) {
    expect(hasPermission(role, permission), `${role} should have ${permission}`).toBe(true);
  }
  for (const permission of denied) {
    expect(hasPermission(role, permission), `${role} should not have ${permission}`).toBe(false);
  }
}

describe("role permissions", () => {
  it("gives owners complete institute-level control", () => {
    expectPermissions(
      "owner",
      [
        "institute.read",
        "institute.update",
        "members.read",
        "members.manage",
        "courses.read",
        "courses.manage",
        "enquiries.read",
        "enquiries.manage_all",
        "finance.read",
        "finance.manage",
        "reports.read",
        "billing.manage",
      ],
      [],
    );
  });

  it("allows admins to run operations but not owner billing", () => {
    expectPermissions(
      "admin",
      [
        "institute.read",
        "institute.update",
        "members.read",
        "members.manage",
        "courses.read",
        "courses.manage",
        "enquiries.read",
        "enquiries.manage_all",
        "finance.read",
        "reports.read",
      ],
      ["billing.manage"],
    );
  });

  it("limits counsellors to assigned enquiry work", () => {
    expectPermissions(
      "counsellor",
      ["institute.read", "courses.read", "enquiries.read", "enquiries.manage_assigned"],
      ["institute.update", "members.manage", "courses.manage", "enquiries.manage_all", "finance.manage", "billing.manage"],
    );
  });

  it("allows finance operations without workspace administration", () => {
    expectPermissions(
      "finance",
      ["institute.read", "courses.read", "finance.read", "finance.manage"],
      ["institute.update", "members.manage", "courses.manage", "enquiries.manage_all", "billing.manage"],
    );
  });
});
