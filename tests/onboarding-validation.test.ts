import { describe, expect, it } from "vitest";
import { parseWorkspaceInput } from "../lib/onboarding/validation";

describe("workspace onboarding validation", () => {
  it("rejects an empty institute name", () => {
    expect(() => parseWorkspaceInput({ name: "", slug: "bright-path" })).toThrow(/name/i);
  });

  it("rejects unsafe or malformed slugs", () => {
    expect(() => parseWorkspaceInput({ name: "Bright Path", slug: "../admin" })).toThrow(
      /slug/i,
    );
    expect(() => parseWorkspaceInput({ name: "Bright Path", slug: "Bright Path" })).toThrow(
      /slug/i,
    );
  });

  it("accepts a normalized workspace identity", () => {
    expect(
      parseWorkspaceInput({
        name: "  Bright Path Academy  ",
        slug: "bright-path-academy",
      }),
    ).toEqual({
      name: "Bright Path Academy",
      slug: "bright-path-academy",
    });
  });
});
