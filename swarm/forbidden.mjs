/**
 * Mirrors the "Forbidden zones" section of AGENTS.md. Kept as a plain list
 * here (rather than parsed out of the markdown) so the check is exact and
 * doesn't depend on prose formatting staying stable.
 */
const FORBIDDEN_PREFIXES = [
  "supabase/",
  "src/lib/supabase.ts",
  "src/hooks/useAuth.ts",
  "src/main.tsx",
  ".env",
  ".github/workflows/",
  "package.json",
  "package-lock.json",
  "swarm/",
  "AGENTS.md",
  "scripts/gate.sh",
];

const FORBIDDEN_SQL_RE = /^supabase-.*\.sql$/;

export function isForbidden(relativePath) {
  const normalized = relativePath.replace(/\\/g, "/");
  if (FORBIDDEN_SQL_RE.test(normalized)) return true;
  return FORBIDDEN_PREFIXES.some(prefix => normalized === prefix || normalized.startsWith(prefix));
}

/**
 * Checks a list of changed paths (from `git diff --name-only`) against a
 * card's file whitelist and the forbidden zones. Returns human-readable
 * violation messages, empty if the diff is entirely within bounds.
 */
export function validateDiff(changedPaths, allowedFiles) {
  const violations = [];
  for (const p of changedPaths) {
    const normalized = p.replace(/\\/g, "/");
    if (isForbidden(normalized)) {
      violations.push(`${normalized} is in a forbidden zone`);
    } else if (!allowedFiles.includes(normalized)) {
      violations.push(`${normalized} is not in the card's file whitelist`);
    }
  }
  return violations;
}
