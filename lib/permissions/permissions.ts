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

const ROLE_PERMISSIONS: Readonly<Record<Role, ReadonlySet<Permission>>> = {
  owner: new Set<Permission>([
    "institute.read",
    "institute.update",
    "members.read",
    "members.manage",
    "courses.read",
    "courses.manage",
    "enquiries.read",
    "enquiries.manage_all",
    "enquiries.manage_assigned",
    "finance.read",
    "finance.manage",
    "reports.read",
    "billing.manage",
  ]),
  admin: new Set<Permission>([
    "institute.read",
    "institute.update",
    "members.read",
    "members.manage",
    "courses.read",
    "courses.manage",
    "enquiries.read",
    "enquiries.manage_all",
    "enquiries.manage_assigned",
    "finance.read",
    "finance.manage",
    "reports.read",
  ]),
  counsellor: new Set<Permission>([
    "institute.read",
    "courses.read",
    "enquiries.read",
    "enquiries.manage_assigned",
  ]),
  finance: new Set<Permission>([
    "institute.read",
    "courses.read",
    "enquiries.read",
    "finance.read",
    "finance.manage",
    "reports.read",
  ]),
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].has(permission);
}

export function permissionsForRole(role: Role): ReadonlySet<Permission> {
  return ROLE_PERMISSIONS[role];
}
