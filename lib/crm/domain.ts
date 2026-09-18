import type { Role } from "../permissions/permissions";

export const ENQUIRY_STATUSES = [
  "new_enquiry",
  "contacted",
  "counselling",
  "demo_scheduled",
  "application",
  "admitted",
  "lost",
] as const;

export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export const ENQUIRY_STATUS_LABELS: Record<EnquiryStatus, string> = {
  new_enquiry: "New enquiry",
  contacted: "Contacted",
  counselling: "Counselling",
  demo_scheduled: "Demo scheduled",
  application: "Application",
  admitted: "Admitted",
  lost: "Lost",
};

export function canManageEnquiry(
  role: Role,
  userId: string,
  assignedTo: string | null,
): boolean {
  if (role === "owner" || role === "admin") {
    return true;
  }

  return role === "counsellor" && assignedTo === userId;
}

export function canCreateEnquiry(
  role: Role,
  userId: string,
  assignedTo: string | null,
): boolean {
  if (role === "owner" || role === "admin") {
    return true;
  }

  return role === "counsellor" && assignedTo === userId;
}
