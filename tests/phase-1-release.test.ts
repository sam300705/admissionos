import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Phase 1 release hygiene", () => {
  it("uses one migration source of truth and locked CI installs", () => {
    expect(existsSync("db/schema.sql")).toBe(false);
    expect(existsSync("supabase/migrations/20260917_foundation.sql")).toBe(true);

    const workflow = readFileSync(".github/workflows/foundation-ci.yml", "utf8");
    expect(workflow).toContain("npm ci");
    expect(workflow).not.toContain("npm install --");
  });

  it("documents demo-data and dedicated-project boundaries", () => {
    const readme = readFileSync("README.md", "utf8");
    expect(readme).toMatch(/demo presentation data/i);
    expect(readme).toMatch(/dedicated AdmissionOS Supabase project/i);
  });
});
