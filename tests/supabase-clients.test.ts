import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const paths = {
  browser: "lib/supabase/client.ts",
  server: "lib/supabase/server.ts",
  middlewareHelper: "lib/supabase/middleware.ts",
  middleware: "middleware.ts",
};

describe("Supabase SSR client contract", () => {
  it("provides browser, server, and middleware clients", () => {
    for (const path of Object.values(paths)) {
      expect(existsSync(path), `${path} should exist`).toBe(true);
    }
  });

  it("uses only public Supabase configuration in browser code", () => {
    const browser = readFileSync(paths.browser, "utf8");
    expect(browser).toContain("getPublicEnv");
    expect(browser).not.toMatch(/SERVICE_ROLE|service[_-]?role/i);
  });

  it("creates a cookie-backed server client", () => {
    const server = readFileSync(paths.server, "utf8");
    expect(server).toContain("createServerClient");
    expect(server).toContain("cookies()");
    expect(server).toContain("setAll");
  });

  it("refreshes verified auth claims through middleware without implementing RBAC there", () => {
    const helper = readFileSync(paths.middlewareHelper, "utf8");
    const root = readFileSync(paths.middleware, "utf8");
    expect(helper).toContain("getClaims");
    expect(helper).toContain("NextResponse");
    expect(root).toContain("updateSession");
    expect(root).not.toMatch(/hasPermission|requirePermission/);
  });
});
