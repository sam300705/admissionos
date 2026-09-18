import { describe, expect, it } from "vitest";
import {
  canCreateEnquiry,
  canManageEnquiry,
  ENQUIRY_STATUSES,
} from "../lib/crm/domain";
import {
  parseCourseInput,
  parseEnquiryInput,
  parseFollowUpInput,
  parseStatusInput,
} from "../lib/crm/validation";

describe("Core CRM domain rules", () => {
  it("uses the canonical enquiry status vocabulary", () => {
    expect(ENQUIRY_STATUSES).toEqual([
      "new_enquiry",
      "contacted",
      "counselling",
      "demo_scheduled",
      "application",
      "admitted",
      "lost",
    ]);
    expect(parseStatusInput("demo_scheduled")).toBe("demo_scheduled");
    expect(() => parseStatusInput("won")).toThrow();
  });

  it("keeps enquiry management least-privilege", () => {
    expect(canManageEnquiry("owner", "u1", null)).toBe(true);
    expect(canManageEnquiry("admin", "u1", "u2")).toBe(true);
    expect(canManageEnquiry("counsellor", "u1", "u1")).toBe(true);
    expect(canManageEnquiry("counsellor", "u1", "u2")).toBe(false);
    expect(canManageEnquiry("finance", "u1", "u1")).toBe(false);
  });

  it("requires counsellors to self-assign newly created enquiries", () => {
    expect(canCreateEnquiry("owner", "u1", null)).toBe(true);
    expect(canCreateEnquiry("admin", "u1", "u2")).toBe(true);
    expect(canCreateEnquiry("counsellor", "u1", "u1")).toBe(true);
    expect(canCreateEnquiry("counsellor", "u1", null)).toBe(false);
    expect(canCreateEnquiry("finance", "u1", null)).toBe(false);
  });

  it("validates course, enquiry, and follow-up inputs", () => {
    expect(parseCourseInput({ name: "JEE 2027", feeInr: "85000" }).feeInr).toBe(85000);
    expect(() => parseCourseInput({ name: "", feeInr: "-1" })).toThrow();

    expect(
      parseEnquiryInput({
        studentName: "Aarav Sharma",
        phone: "9876543210",
        email: "",
        courseId: "",
        source: "Website",
        assignment: "self",
      }).assignment,
    ).toBe("self");

    expect(() =>
      parseFollowUpInput({ enquiryId: "bad", dueAt: "", notes: "" }),
    ).toThrow();
  });
});
