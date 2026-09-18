import { describe, expect, it } from "vitest";
import { resolveAuthRoute } from "../lib/auth/route-decision";

describe("protected route resolution", () => {
  it("sends anonymous visitors to sign-in", () => {
    expect(resolveAuthRoute({ authenticated: false, hasActiveMembership: false })).toBe(
      "/sign-in",
    );
  });

  it("sends authenticated users without an active workspace to onboarding", () => {
    expect(resolveAuthRoute({ authenticated: true, hasActiveMembership: false })).toBe(
      "/onboarding",
    );
  });

  it("sends active institute members to the dashboard", () => {
    expect(resolveAuthRoute({ authenticated: true, hasActiveMembership: true })).toBe(
      "/dashboard",
    );
  });
});
