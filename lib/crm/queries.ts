import { createServerSupabaseClient } from "../supabase/server";
import type { EnquiryStatus } from "./domain";

export type CourseRecord = {
  id: string;
  name: string;
  code: string | null;
  feeInr: number;
  durationText: string | null;
  active: boolean;
};

export type EnquiryRecord = {
  id: string;
  studentName: string;
  phone: string;
  email: string | null;
  source: string | null;
  status: EnquiryStatus;
  assignedTo: string | null;
  courseId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ActivityRecord = {
  id: string;
  activityType: string;
  body: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type FollowUpRecord = {
  id: string;
  enquiryId: string;
  assignedTo: string;
  dueAt: string;
  status: "scheduled" | "completed" | "cancelled";
  notes: string | null;
  completedAt: string | null;
};

function assertNoError(error: { message?: string } | null, operation: string) {
  if (error) {
    throw new Error(`CRM query failed: ${operation}`);
  }
}

export async function listCourses(instituteId: string): Promise<CourseRecord[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("courses")
    .select("id,name,code,fee_inr,duration_text,active")
    .eq("institute_id", instituteId)
    .order("active", { ascending: false })
    .order("name");

  assertNoError(error, "list courses");

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    code: row.code,
    feeInr: Number(row.fee_inr),
    durationText: row.duration_text,
    active: row.active,
  }));
}

export async function listEnquiries(instituteId: string): Promise<EnquiryRecord[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("enquiries")
    .select(
      "id,student_name,phone,email,source,status,assigned_to,course_id,created_at,updated_at",
    )
    .eq("institute_id", instituteId)
    .order("created_at", { ascending: false });

  assertNoError(error, "list enquiries");

  return (data ?? []).map((row) => ({
    id: row.id,
    studentName: row.student_name,
    phone: row.phone,
    email: row.email,
    source: row.source,
    status: row.status as EnquiryStatus,
    assignedTo: row.assigned_to,
    courseId: row.course_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getEnquiry(
  instituteId: string,
  enquiryId: string,
): Promise<EnquiryRecord | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("enquiries")
    .select(
      "id,student_name,phone,email,source,status,assigned_to,course_id,created_at,updated_at",
    )
    .eq("institute_id", instituteId)
    .eq("id", enquiryId)
    .maybeSingle();

  assertNoError(error, "get enquiry");

  if (!data) return null;

  return {
    id: data.id,
    studentName: data.student_name,
    phone: data.phone,
    email: data.email,
    source: data.source,
    status: data.status as EnquiryStatus,
    assignedTo: data.assigned_to,
    courseId: data.course_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function listActivities(
  instituteId: string,
  enquiryId: string,
): Promise<ActivityRecord[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("enquiry_activities")
    .select("id,activity_type,body,metadata,created_at")
    .eq("institute_id", instituteId)
    .eq("enquiry_id", enquiryId)
    .order("created_at", { ascending: false });

  assertNoError(error, "list activities");

  return (data ?? []).map((row) => ({
    id: row.id,
    activityType: row.activity_type,
    body: row.body,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.created_at,
  }));
}

export async function listFollowUps(
  instituteId: string,
  enquiryId?: string,
): Promise<FollowUpRecord[]> {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("follow_ups")
    .select("id,enquiry_id,assigned_to,due_at,status,notes,completed_at")
    .eq("institute_id", instituteId)
    .order("due_at", { ascending: true });

  if (enquiryId) {
    query = query.eq("enquiry_id", enquiryId);
  }

  const { data, error } = await query;
  assertNoError(error, "list follow-ups");

  return (data ?? []).map((row) => ({
    id: row.id,
    enquiryId: row.enquiry_id,
    assignedTo: row.assigned_to,
    dueAt: row.due_at,
    status: row.status as FollowUpRecord["status"],
    notes: row.notes,
    completedAt: row.completed_at,
  }));
}

export async function getDashboardData(instituteId: string) {
  const [courses, enquiries, followUps] = await Promise.all([
    listCourses(instituteId),
    listEnquiries(instituteId),
    listFollowUps(instituteId),
  ]);

  const open = enquiries.filter(
    (enquiry) => enquiry.status !== "admitted" && enquiry.status !== "lost",
  ).length;
  const admitted = enquiries.filter((enquiry) => enquiry.status === "admitted").length;
  const scheduled = followUps.filter((followUp) => followUp.status === "scheduled");

  return {
    courses,
    enquiries,
    followUps,
    metrics: {
      open,
      admitted,
      activeCourses: courses.filter((course) => course.active).length,
      scheduledFollowUps: scheduled.length,
    },
  };
}
