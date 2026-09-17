export type Role = "owner" | "admin" | "counsellor" | "finance";

export type Permission =
  | "institute.read"
  | "institute.update"
  | "members.read"
  | "members.manage"
  | "courses.read"
  | "courses.manage"
  | "enquiries.read"
  | "enquiries.manage_all"
  | "enquiries.manage_assigned"
  | "finance.read"
  | "finance.manage"
  | "reports.read"
  | "billing.manage";

// TDD stub: Task 2 tests define the permission contract before implementation.
export function hasPermission(_role: Role, _permission: Permission): boolean {
  return false;
}
