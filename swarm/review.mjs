import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { findCardById, setCardStatus } from "./card.mjs";
import { validateDiff } from "./forbidden.mjs";
import {
  buildWorkerPrompt,
  buildReviewFixPrompt,
  buildReviewerPrompt,
  parseFileBlocks,
  parseReviewVerdict,
} from "./prompt.mjs";
import { callModel, limits } from "./models.mjs";
import {
  addAll,
  commitAll,
  diffBetween,
  diffNameOnly,
  ensureIntegrationWorktree,
  findWorktreeForBranch,
  mergeBase,
  mergeBranch,
  resetHard,
} from "./git.mjs";
import { writeFiles, runGate, tail } from "./worktreeOps.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const kanbanDir = path.join(repoRoot, "kanban");
const logsDir = path.join(__dirname, "logs");

const cardId = process.argv[2];
if (!cardId) {
  console.error("Usage: node swarm/review.mjs <card-id>");
  process.exit(1);
}

mkdirSync(logsDir, { recursive: true });
const logPath = path.join(logsDir, `${cardId}-review-${Date.now()}.log`);
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
    console.error(`Card ${cardId} not found in ${kanbanDir}.`);
    process.exit(1);
  }

  if (card.status !== "review") {
    console.error(`Card ${cardId} has status "${card.status}", expected "review". Aborting.`);
    process.exit(1);
  }

  const branch = `card/${card.id}`;
  const worktreePath = findWorktreeForBranch(repoRoot, branch);
  if (!worktreePath) {
    log(`No worktree found for ${branch}. It must have been removed after the gate run.`);
    setCardStatus(card.path, "blocked");
    process.exit(1);
  }

  try {
    await reviewCard(card, branch, worktreePath);
  } catch (err) {
    log(`Unhandled error while reviewing card ${card.id}: ${err.stack || err.message}`);
    setCardStatus(card.path, "blocked");
    process.exitCode = 1;
  }
}

async function reviewCard(card, branch, worktreePath) {
  const agentsMd = readFileSync(path.join(repoRoot, "AGENTS.md"), "utf8");
  const basePrompt = buildWorkerPrompt(agentsMd, card);
  const maxRounds = limits.maxAttempts;

  for (let round = 1; round <= maxRounds; round++) {
    const base = mergeBase(repoRoot, "main", branch);
    const diffText = diffBetween(repoRoot, base, branch);

    log(`Round ${round}/${maxRounds}: sending diff to reviewer.`);
    const reviewResponse = await callModel("reviewer", buildReviewerPrompt(card, diffText));
    const { verdict, comments } = parseReviewVerdict(reviewResponse);

    if (verdict === "approve") {
      log("Reviewer approved. Merging into swarm/integration.");
      const integrationPath = ensureIntegrationWorktree(repoRoot);
      mergeBranch(integrationPath, branch, `Merge ${branch}: ${card.title}`);
      setCardStatus(card.path, "done");
      log(`Card ${card.id} merged into swarm/integration and marked done.`);
      return;
    }

    log(`Reviewer rejected:\n${comments.map(c => `- ${c}`).join("\n")}`);

    if (round === maxRounds) break;

    log(`Round ${round}/${maxRounds}: asking worker to address review feedback.`);
    const currentFiles = new Map(
      card.files
        .filter(f => existsSync(path.join(worktreePath, f)))
        .map(f => [f, readFileSync(path.join(worktreePath, f), "utf8")])
    );
    const fixPrompt = buildReviewFixPrompt(basePrompt, currentFiles, comments);
    const response = await callModel("worker", fixPrompt);
    const files = parseFileBlocks(response);

    if (files.size === 0) {
      log("Worker response contained no parseable FILE blocks. Blocking card.");
      setCardStatus(card.path, "blocked");
      return;
    }

    writeFiles(worktreePath, [...files], card.files, log);
    addAll(worktreePath);

    const changed = diffNameOnly(worktreePath);
    const violations = validateDiff(changed, card.files);
    if (violations.length > 0) {
      log(`Diff violates the file whitelist / forbidden zones:\n${violations.join("\n")}`);
      resetHard(worktreePath);
      setCardStatus(card.path, "blocked");
      return;
    }

    const gateResult = runGate(worktreePath);
    if (!gateResult.ok) {
      log(`Gate failed after addressing review feedback:\n${tail(gateResult.output, 1500)}`);
      setCardStatus(card.path, "blocked");
      return;
    }

    commitAll(worktreePath, `Address review feedback: ${card.title}`);
    log("Gate passed after addressing feedback. Sending back to reviewer.");
  }

  log(`Reviewer rejected the card after ${maxRounds} rounds. Blocking card.`);
  setCardStatus(card.path, "blocked");
}

main().catch(err => {
  console.error(`Fatal error before review started: ${err.stack || err.message}`);
  process.exit(1);
});
