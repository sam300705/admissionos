import { describe, expect, it } from "vitest";
import {
  parseForgotPasswordInput,
  parseResetPasswordInput,
  parseSignInInput,
  parseSignUpInput,
  safeNextPath,
} from "../lib/auth/validation";

describe("auth input validation", () => {
  it("rejects malformed sign-in email", () => {
    expect(() =>
      parseSignInInput({ email: "not-an-email", password: "correct-length" }),
    ).toThrow(/email/i);
  });

  it("rejects weak sign-up passwords", () => {
    expect(() =>
      parseSignUpInput({
        fullName: "Sambhav",
        email: "sambhav@example.com",
        password: "123",
      }),
    ).toThrow(/password/i);
  });

  it("validates password-reset requests and new passwords", () => {
    expect(() => parseForgotPasswordInput({ email: "bad" })).toThrow(/email/i);
    expect(() => parseResetPasswordInput({ password: "short" })).toThrow(/password/i);
    expect(parseResetPasswordInput({ password: "long-enough-password" })).toEqual({
      password: "long-enough-password",
    });
  });

  it("allows only local redirect paths", () => {
    expect(safeNextPath("/dashboard")).toBe("/dashboard");
    expect(safeNextPath("/onboarding?source=auth")).toBe("/onboarding?source=auth");
    expect(safeNextPath("https://evil.example")).toBe("/dashboard");
    expect(safeNextPath("//evil.example/path")).toBe("/dashboard");
    expect(safeNextPath("dashboard")).toBe("/dashboard");
  });
});
