import { describe, expect, it } from "vitest";
import { readPublicEnv } from "../lib/env";

describe("readPublicEnv", () => {
  it("rejects missing Supabase configuration", () => {
    expect(() => readPublicEnv({})).toThrow(/Supabase/i);
  });

  it("rejects an insecure Supabase URL", () => {
    expect(() =>
      readPublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: "http://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
      }),
    ).toThrow(/https/i);
  });

  it("accepts a valid https URL and publishable key", () => {
    expect(
      readPublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
      }),
    ).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
    });
  });
});
