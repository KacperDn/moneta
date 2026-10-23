import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { findCardById, setCardStatus } from "./card.mjs";
import { validateDiff } from "./forbidden.mjs";
import { buildWorkerPrompt, buildFixPrompt, parseFileBlocks } from "./prompt.mjs";
import { callModel, limits } from "./models.mjs";
import { createWorktree, cleanupWorktree, diffNameOnly, addAll, commitAll, resetHard } from "./git.mjs";
import { writeFiles, runGate, tail } from "./worktreeOps.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const kanbanDir = path.join(repoRoot, "kanban");
const logsDir = path.join(__dirname, "logs");

const cardId = process.argv[2];
if (!cardId) {
  console.error("Usage: node swarm/run.mjs <card-id>");
  process.exit(1);
}

mkdirSync(logsDir, { recursive: true });
const logPath = path.join(logsDir, `${cardId}-${Date.now()}.log`);
const logLines = [];

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(line);
  logLines.push(line);
  writeFileSync(logPath, logLines.join("\n") + "\n");
}

async function main() {
  const card = findCardById(kanbanDir, cardId);
  if (!card) {
    log(`Card ${cardId} not found in ${kanbanDir}.`);
    process.exit(1);
  }

  if (card.status !== "ready") {
    log(`Card ${cardId} has status "${card.status}", expected "ready". Aborting.`);
    process.exit(1);
  }

  log(`Starting card ${card.id}: ${card.title}`);
  setCardStatus(card.path, "running");

  try {
    await runCard(card);
  } catch (err) {
    log(`Unhandled error while processing card ${card.id}: ${err.stack || err.message}`);
    setCardStatus(card.path, "blocked");
    process.exitCode = 1;
  }
}

async function runCard(card) {
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

main().catch(err => {
  console.error(`Fatal error before card processing started: ${err.stack || err.message}`);
  process.exit(1);
});
