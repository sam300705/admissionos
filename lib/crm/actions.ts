"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveMembership, type ActiveMembership } from "../auth/session";
import { hasPermission } from "../permissions/permissions";
import { createServerSupabaseClient } from "../supabase/server";
import { canCreateEnquiry, canManageEnquiry } from "./domain";
import {
  parseCourseInput,
  parseEnquiryInput,
  parseFollowUpInput,
  parseNoteInput,
  parseStatusInput,
  parseUuid,
} from "./validation";

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

async function loadManagedEnquiry(
  membership: ActiveMembership,
  userId: string,
  enquiryId: string,
) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("enquiries")
    .select("id,assigned_to")
    .eq("id", enquiryId)
    .eq("institute_id", membership.instituteId)
    .maybeSingle();

  if (error || !data) {
    fail("/enquiries", "Enquiry not found.");
  }

  if (!canManageEnquiry(membership.role, userId, data.assigned_to)) {
    fail(`/enquiries/${enquiryId}`, "You do not have permission to manage this enquiry.");
  }

  return data;
}

export async function createCourse(formData: FormData) {
  const { user, membership } = await requireActiveMembership();

  if (!hasPermission(membership.role, "courses.manage")) {
    fail("/courses", "You do not have permission to manage courses.");
  }

  let input;
  try {
    input = parseCourseInput({
      name: field(formData, "name"),
      code: field(formData, "code"),
      feeInr: field(formData, "feeInr"),
      durationText: field(formData, "durationText"),
    });
  } catch {
    fail("/courses", "Enter a valid course name and non-negative fee.");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("courses").insert({
    institute_id: membership.instituteId,
    name: input.name,
    code: input.code ?? null,
    fee_inr: input.feeInr,
    duration_text: input.durationText ?? null,
    created_by: user.id,
  });

  if (error?.code === "23505") {
    fail("/courses", "A course with that name already exists.");
  }
  if (error) {
    fail("/courses", "Course could not be created.");
  }

  revalidatePath("/courses");
  revalidatePath("/dashboard");
  redirect("/courses");
}

export async function createEnquiry(formData: FormData) {
  const { user, membership } = await requireActiveMembership();

  let input;
  try {
    input = parseEnquiryInput({
      studentName: field(formData, "studentName"),
      phone: field(formData, "phone"),
      email: field(formData, "email"),
      courseId: field(formData, "courseId"),
      source: field(formData, "source"),
      assignment: field(formData, "assignment"),
    });
  } catch {
    fail("/enquiries", "Enter a valid student name, phone, and enquiry details.");
  }

  const assignedTo = input.assignment === "self" ? user.id : null;

  if (!canCreateEnquiry(membership.role, user.id, assignedTo)) {
    fail("/enquiries", "Counsellors must assign new enquiries to themselves.");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("enquiries").insert({
    institute_id: membership.instituteId,
    course_id: input.courseId ?? null,
    student_name: input.studentName,
    phone: input.phone,
    email: input.email ?? null,
    source: input.source ?? null,
    assigned_to: assignedTo,
    created_by: user.id,
  });

  if (error) {
    fail("/enquiries", "Enquiry could not be created.");
  }

  revalidatePath("/enquiries");
  revalidatePath("/dashboard");
  redirect("/enquiries");
}

export async function updateEnquiryStatus(formData: FormData) {
  const { user, membership } = await requireActiveMembership();

  let enquiryId: string;
  let status;
  try {
    enquiryId = parseUuid(field(formData, "enquiryId"), "enquiry");
    status = parseStatusInput(field(formData, "status"));
  } catch {
    fail("/enquiries", "Invalid enquiry update.");
  }

  await loadManagedEnquiry(membership, user.id, enquiryId);
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("enquiries")
    .update({ status })
    .eq("id", enquiryId)
    .eq("institute_id", membership.instituteId);

  if (error) {
    fail(`/enquiries/${enquiryId}`, "Status could not be updated.");
  }

  revalidatePath(`/enquiries/${enquiryId}`);
  revalidatePath("/enquiries");
  revalidatePath("/dashboard");
  redirect(`/enquiries/${enquiryId}`);
}

export async function addEnquiryNote(formData: FormData) {
  const { user, membership } = await requireActiveMembership();

  let input;
  try {
    input = parseNoteInput({
      enquiryId: field(formData, "enquiryId"),
      body: field(formData, "body"),
    });
  } catch {
    fail("/enquiries", "Enter a valid note.");
  }

  await loadManagedEnquiry(membership, user.id, input.enquiryId);
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("enquiry_activities").insert({
    institute_id: membership.instituteId,
    enquiry_id: input.enquiryId,
    actor_id: user.id,
    activity_type: "note",
    body: input.body,
  });

  if (error) {
    fail(`/enquiries/${input.enquiryId}`, "Note could not be saved.");
  }

  revalidatePath(`/enquiries/${input.enquiryId}`);
  redirect(`/enquiries/${input.enquiryId}`);
}

export async function scheduleFollowUp(formData: FormData) {
  const { user, membership } = await requireActiveMembership();

  let input;
  try {
    input = parseFollowUpInput({
      enquiryId: field(formData, "enquiryId"),
      dueAt: field(formData, "dueAt"),
      notes: field(formData, "notes"),
    });
  } catch {
    fail("/enquiries", "Enter a valid follow-up date.");
  }

  await loadManagedEnquiry(membership, user.id, input.enquiryId);
  const dueAt = new Date(input.dueAt);

  if (dueAt.getTime() <= Date.now()) {
    fail(`/enquiries/${input.enquiryId}`, "Follow-up must be scheduled in the future.");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("follow_ups").insert({
    institute_id: membership.instituteId,
    enquiry_id: input.enquiryId,
    assigned_to: user.id,
    due_at: dueAt.toISOString(),
    notes: input.notes ?? null,
    created_by: user.id,
  });

  if (error) {
    fail(`/enquiries/${input.enquiryId}`, "Follow-up could not be scheduled.");
  }

  revalidatePath(`/enquiries/${input.enquiryId}`);
  revalidatePath("/follow-ups");
  revalidatePath("/dashboard");
  redirect(`/enquiries/${input.enquiryId}`);
}

export async function completeFollowUp(formData: FormData) {
  const { user, membership } = await requireActiveMembership();

  let followUpId: string;
  try {
    followUpId = parseUuid(field(formData, "followUpId"), "follow-up");
  } catch {
    fail("/follow-ups", "Invalid follow-up.");
  }

  const supabase = await createServerSupabaseClient();
  const { data, error: lookupError } = await supabase
    .from("follow_ups")
    .select("id,enquiry_id,assigned_to,status")
    .eq("id", followUpId)
    .eq("institute_id", membership.instituteId)
    .maybeSingle();

  if (lookupError || !data) {
    fail("/follow-ups", "Follow-up not found.");
  }

  const allowed =
    membership.role === "owner" ||
    membership.role === "admin" ||
    (membership.role === "counsellor" && data.assigned_to === user.id);

  if (!allowed) {
    fail("/follow-ups", "You do not have permission to complete this follow-up.");
  }

  if (data.status !== "scheduled") {
    redirect("/follow-ups");
  }

  const { error } = await supabase
    .from("follow_ups")
    .update({
      status: "completed",
      completed_by: user.id,
      completed_at: new Date().toISOString(),
    })
    .eq("id", followUpId)
    .eq("institute_id", membership.instituteId);

  if (error) {
    fail("/follow-ups", "Follow-up could not be completed.");
  }

  revalidatePath("/follow-ups");
  revalidatePath(`/enquiries/${data.enquiry_id}`);
  revalidatePath("/dashboard");
  redirect("/follow-ups");
}
