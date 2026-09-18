import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("workspace onboarding security", () => {
  it("derives ownership from the authenticated user instead of form input", () => {
    const source = readFileSync("lib/onboarding/actions.ts", "utf8");
    expect(source).toContain("requireUser");
    expect(source).toContain("created_by: user.id");
    expect(source).not.toMatch(/field\(formData,\s*["'](?:role|userId|user_id|ownerId|owner_id)["']/);
  });
});
