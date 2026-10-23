import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { findCardById, setCardStatus } from "./card.mjs";
import { validateDiff } from "./forbidden.mjs";
import { buildWorkerPrompt, buildFixPrompt, parseFileBlocks } from "./prompt.mjs";
import { callModel, limits } from "./models.mjs";
import { createWorktree, cleanupWorktree, diffNameOnly, addAll, commitAll, resetHard } from "./git.mjs";
import { writeFiles, runGate, tail } from "./worktreeOps.mjs";
import { createLogger } from "./logger.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const kanbanDir = path.join(repoRoot, "kanban");

/** Runs the worker + gate loop for one "ready" card. Safe to call concurrently for different cards. */
export async function processCard(cardId) {
  const log = createLogger(cardId, "run");
  const card = findCardById(kanbanDir, cardId);

  if (!card) {
    log(`Card ${cardId} not found in ${kanbanDir}.`);
    return { ok: false };
  }
  if (card.status !== "ready") {
    log(`Card ${cardId} has status "${card.status}", expected "ready". Aborting.`);
    return { ok: false };
  }

  log(`Starting card ${card.id}: ${card.title}`);
  setCardStatus(card.path, "running");

  try {
    await runCard(card, log);
    return { ok: true };
  } catch (err) {
    log(`Unhandled error while processing card ${card.id}: ${err.stack || err.message}`);
    setCardStatus(card.path, "blocked");
    return { ok: false };
  }
}

async function runCard(card, log) {
  const branch = `card/${card.id}`;
  const worktreePath = path.join(repoRoot, ".worktrees", `card-${card.id}`);

  cleanupWorktree(repoRoot, worktreePath, branch);
  createWorktree(repoRoot, worktreePath, branch);
  log(`Created worktree at ${worktreePath} on branch ${branch}.`);

  const agentsMd = readFileSync(path.join(repoRoot, "AGENTS.md"), "utf8");
  const basePrompt = buildWorkerPrompt(agentsMd, card);

  let currentFiles = null;
  let gateResult = null;
  const maxAttempts = limits.maxAttempts;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    log(`Attempt ${attempt}/${maxAttempts}: calling worker model.`);

    const prompt = attempt === 1
      ? basePrompt
      : buildFixPrompt(basePrompt, currentFiles, tail(gateResult.output));

    const response = await callModel("worker", prompt);
    currentFiles = parseFileBlocks(response);

    if (currentFiles.size === 0) {
      log("Worker response contained no parseable FILE blocks. Blocking card.");
      setCardStatus(card.path, "blocked");
      return;
    }

    writeFiles(worktreePath, [...currentFiles], card.files, log);
    addAll(worktreePath);

    const changed = diffNameOnly(worktreePath);
    const violations = validateDiff(changed, card.files);

    if (violations.length > 0) {
      log(`Diff violates the file whitelist / forbidden zones:\n${violations.join("\n")}`);
      log("Rejecting without retry (scope violations are not something a fix attempt should paper over).");
      resetHard(worktreePath);
      setCardStatus(card.path, "blocked");
      return;
    }

    log(`Diff stays within the whitelist (${changed.join(", ") || "no changes"}). Running gate.sh.`);
    gateResult = runGate(worktreePath);

    if (gateResult.ok) {
      log("Gate passed.");
      commitAll(worktreePath, card.title);
      setCardStatus(card.path, "review");
      log(`Card ${card.id} moved to review on branch ${branch}.`);
      return;
    }

    log(`Gate failed on attempt ${attempt}:\n${tail(gateResult.output, 1500)}`);
  }

  log(`Gate still failing after ${maxAttempts} attempts. Blocking card.`);
  setCardStatus(card.path, "blocked");
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const cardId = process.argv[2];
  if (!cardId) {
    console.error("Usage: node swarm/run.mjs <card-id>");
    process.exit(1);
  }
  const result = await processCard(cardId);
  if (!result.ok) process.exitCode = 1;
}
