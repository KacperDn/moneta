import { writeFileSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

/**
 * Writes only files whose path is in the whitelist, resolved and checked to
 * stay inside the worktree. This is a first line of defense against a
 * model-produced path escaping the project (e.g. "../../x"); the git-diff
 * whitelist check after `git add` is the authoritative one.
 */
export function writeFiles(worktreePath, files, allowedFiles, log) {
  const worktreeRoot = path.resolve(worktreePath);
  for (const [relativePath, content] of files) {
    if (!allowedFiles.includes(relativePath)) {
      log(`Ignoring file "${relativePath}" returned by the model — not in the card's whitelist.`);
      continue;
    }
    const absolute = path.resolve(worktreeRoot, relativePath);
    if (!absolute.startsWith(worktreeRoot + path.sep)) {
      log(`Refusing to write "${relativePath}" — resolves outside the worktree.`);
      continue;
    }
    mkdirSync(path.dirname(absolute), { recursive: true });
    writeFileSync(absolute, content);
  }
}

export function runGate(worktreePath) {
  const result = spawnSync("bash", ["scripts/gate.sh"], { cwd: worktreePath, encoding: "utf8" });
  const output = (result.stdout || "") + (result.stderr || "");
  return { ok: result.status === 0, output };
}

export function tail(text, maxChars = 4000) {
  return text.length > maxChars ? text.slice(-maxChars) : text;
}
