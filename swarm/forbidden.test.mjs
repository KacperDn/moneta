import { describe, it, expect } from "vitest";
import { isForbidden, validateDiff } from "./forbidden.mjs";

describe("isForbidden", () => {
  it.each([
    "supabase/config.toml",
    "supabase-budgets-migration.sql",
    "src/lib/supabase.ts",
    "src/hooks/useAuth.ts",
    "src/main.tsx",
    ".env",
    ".env.local",
    ".github/workflows/deploy.yml",
    "package.json",
    "package-lock.json",
    "swarm/run.mjs",
    "AGENTS.md",
    "scripts/gate.sh",
  ])("blocks %s", path => {
    expect(isForbidden(path)).toBe(true);
  });

  it("normalizes Windows path separators", () => {
    expect(isForbidden(["swarm", "run.mjs"].join("\\"))).toBe(true);
  });

  it("allows ordinary source files", () => {
    expect(isForbidden("src/utils/exportCsv.ts")).toBe(false);
    expect(isForbidden("src/hooks/useExpenses.ts")).toBe(false);
  });

  it("does not block files that merely share a prefix with a forbidden name", () => {
    expect(isForbidden("src/lib/supabaseHelpers.ts")).toBe(false);
  });
});

describe("validateDiff", () => {
  const allowed = ["src/utils/a.ts", "src/utils/a.test.ts"];

  it("returns no violations when every change is whitelisted", () => {
    expect(validateDiff(["src/utils/a.ts", "src/utils/a.test.ts"], allowed)).toEqual([]);
  });

  it("flags files outside the whitelist", () => {
    expect(validateDiff(["src/utils/b.ts"], allowed)).toEqual([
      "src/utils/b.ts is not in the card's file whitelist",
    ]);
  });

  it("reports forbidden zones even if the card whitelisted the file", () => {
    const violations = validateDiff(["package.json"], ["package.json"]);
    expect(violations).toEqual(["package.json is in a forbidden zone"]);
  });
});
