import { z } from "zod";
import { ENQUIRY_STATUSES } from "./domain";

const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalText = (max: number) =>
  z.preprocess(blankToUndefined, z.string().trim().max(max).optional());

const optionalEmail = z.preprocess(
  blankToUndefined,
  z.string().trim().email("Enter a valid email address").optional(),
);

const optionalUuid = z.preprocess(
  blankToUndefined,
  z.string().uuid("Invalid identifier").optional(),
);

const courseSchema = z.object({
  name: z.string().trim().min(2, "Course name is required").max(160),
  code: optionalText(40),
  feeInr: z.coerce
    .number()
    .int("Fee must be a whole number")
    .min(0, "Fee cannot be negative")
    .max(1_000_000_000, "Fee is too large"),
  durationText: optionalText(80),
});

const enquirySchema = z.object({
  studentName: z.string().trim().min(2, "Student name is required").max(160),
  phone: z.string().trim().min(5, "Phone is required").max(30),
  email: optionalEmail,
  courseId: optionalUuid,
  source: optionalText(100),
  assignment: z.enum(["unassigned", "self"]),
});

const statusSchema = z.enum(ENQUIRY_STATUSES);

const followUpSchema = z.object({
  enquiryId: z.string().uuid("Invalid enquiry"),
  dueAt: z
    .string()
    .min(1, "Follow-up date is required")
    .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid follow-up date"),
  notes: optionalText(1000),
});

const noteSchema = z.object({
  enquiryId: z.string().uuid("Invalid enquiry"),
  body: z.string().trim().min(1, "Note cannot be empty").max(4000),
});

export type CourseInput = z.infer<typeof courseSchema>;
export type EnquiryInput = z.infer<typeof enquirySchema>;
export type FollowUpInput = z.infer<typeof followUpSchema>;

export function parseCourseInput(input: unknown): CourseInput {
  return courseSchema.parse(input);
}

export function parseEnquiryInput(input: unknown): EnquiryInput {
  return enquirySchema.parse(input);
}

export function parseStatusInput(input: unknown) {
  return statusSchema.parse(input);
}

export function parseFollowUpInput(input: unknown): FollowUpInput {
  return followUpSchema.parse(input);
}

export function parseNoteInput(input: unknown) {
  return noteSchema.parse(input);
}

export function parseUuid(input: unknown, label = "identifier") {
  return z.string().uuid(`Invalid ${label}`).parse(input);
}
