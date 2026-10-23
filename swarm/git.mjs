import { spawnSync } from "node:child_process";
import path from "node:path";

function run(args, cwd) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed:\n${result.stderr || result.stdout}`);
  }
  return result.stdout.trim();
}

/** Removes a stale worktree/branch from a previous run, if present. Ignores "doesn't exist" errors. */
export function cleanupWorktree(repoRoot, worktreePath, branch) {
  spawnSync("git", ["worktree", "remove", "--force", worktreePath], { cwd: repoRoot, encoding: "utf8" });
  spawnSync("git", ["branch", "-D", branch], { cwd: repoRoot, encoding: "utf8" });
}

export function createWorktree(repoRoot, worktreePath, branch, baseRef = "HEAD") {
  run(["worktree", "add", "-b", branch, worktreePath, baseRef], repoRoot);
}

export function diffNameOnly(worktreePath, baseRef = "HEAD") {
  const output = run(["diff", "--name-only", baseRef], worktreePath);
  return output ? output.split("\n") : [];
}

export function addAll(worktreePath) {
  run(["add", "-A"], worktreePath);
}

export function commitAll(worktreePath, message) {
  run(["commit", "-m", message], worktreePath);
}

export function resetHard(worktreePath, baseRef = "HEAD") {
  run(["reset", "--hard", baseRef], worktreePath);
}

export function mergeBase(repoRoot, refA, refB) {
  return run(["merge-base", refA, refB], repoRoot);
}

export function diffBetween(repoRoot, refA, refB) {
  return run(["diff", `${refA}..${refB}`], repoRoot);
}

/** Finds the filesystem path of an existing worktree checked out on `branch`, if any. */
export function findWorktreeForBranch(repoRoot, branch) {
  const output = run(["worktree", "list", "--porcelain"], repoRoot);
  const entries = output.split("\n\n");
  for (const entry of entries) {
    const pathMatch = entry.match(/^worktree (.+)$/m);
    const branchMatch = entry.match(/^branch refs\/heads\/(.+)$/m);
    if (pathMatch && branchMatch && branchMatch[1] === branch) {
      return pathMatch[1];
    }
  }
  return null;
}

/**
 * Ensures the long-lived `swarm/integration` branch has a dedicated worktree,
 * creating both from `main` on first use. Approved cards are merged in here —
 * never into the user's own checkout, and never into `main`.
 */
export function ensureIntegrationWorktree(repoRoot) {
  const branch = "swarm/integration";
  const worktreePath = path.join(repoRoot, ".worktrees", "integration");
  const existing = findWorktreeForBranch(repoRoot, branch);
  if (existing) return existing;

  const branchExists = spawnSync("git", ["rev-parse", "--verify", branch], { cwd: repoRoot }).status === 0;
  if (branchExists) {
    run(["worktree", "add", worktreePath, branch], repoRoot);
  } else {
    run(["worktree", "add", "-b", branch, worktreePath, "main"], repoRoot);
  }
  return worktreePath;
}

export function mergeBranch(worktreePath, branch, message) {
  run(["merge", "--no-ff", branch, "-m", message], worktreePath);
}
