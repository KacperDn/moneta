/**
 * Runs several "ready" cards in parallel, one git worktree per card (same
 * mechanism as run.mjs). Kept deliberately small — this is the optional,
 * higher-risk phase of the orchestrator. Trade-offs, read before using this
 * for anything that matters:
 *
 * - Cards whose `files` whitelists overlap are run sequentially, never
 *   concurrently. Each card still gets its own worktree, so two cards
 *   touching the same file wouldn't corrupt each other's working copy —
 *   the real problem is at merge time: whichever card's reviewer approves
 *   second will hit a git merge conflict against swarm/integration. This
 *   orchestrator makes no attempt to resolve that, so avoiding it upfront
 *   is simpler than handling it after the fact.
 * - All worktrees share one `node_modules` (Node's module resolution walks
 *   up from `.worktrees/card-X/` to the repo root — this only works because
 *   `.worktrees/` lives inside the repo). Concurrent `vite build` runs share
 *   Vite's on-disk cache, which is a plausible source of flaky, hard-to-
 *   reproduce gate failures under parallel runs. A gate failure under
 *   runMany.mjs is worth re-running alone under run.mjs before trusting it.
 * - Each parallel card is a full independent run of the worker model (and
 *   later the reviewer model). On a free-tier API key this multiplies how
 *   fast you hit per-minute/per-day quota limits — we hit a zero-quota wall
 *   on a "pro" tier model after a handful of sequential calls during
 *   testing. Parallelism here trades API quota for wall-clock time; on a
 *   free tier that trade is usually not worth it.
 * - No parallel benefit if your machine is the bottleneck: N concurrent
 *   `vite build` runs compete for the same CPU, so wall-clock time may not
 *   improve much over running the cards one at a time.
 *
 * Net recommendation: use this for 2-3 cards with clearly disjoint files
 * when you have API headroom, not as the default way of running cards.
 */
import { findCardById } from "./card.mjs";
import { processCard } from "./run.mjs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kanbanDir = path.join(__dirname, "..", "kanban");

function filesOverlap(a, b) {
  return a.some(f => b.includes(f));
}

/** Greedily buckets cards into batches with no file overlap within a batch. */
function scheduleBatches(cards) {
  const batches = [];
  for (const card of cards) {
    const batch = batches.find(b => b.every(c => !filesOverlap(c.files, card.files)));
    if (batch) batch.push(card);
    else batches.push([card]);
  }
  return batches;
}

async function main() {
  const ids = process.argv.slice(2);
  if (ids.length < 2) {
    console.error("Usage: node swarm/runMany.mjs <card-id> <card-id> [...]");
    process.exit(1);
  }

  const cards = [];
  for (const id of ids) {
    const card = findCardById(kanbanDir, id);
    if (!card) {
      console.error(`Card ${id} not found. Aborting.`);
      process.exit(1);
    }
    if (card.status !== "ready") {
      console.error(`Card ${id} has status "${card.status}", expected "ready". Aborting.`);
      process.exit(1);
    }
    cards.push(card);
  }

  const batches = scheduleBatches(cards);
  console.log(
    `Scheduled ${cards.length} card(s) into ${batches.length} batch(es): ` +
    batches.map(b => `[${b.map(c => c.id).join(", ")}]`).join(", ")
  );

  let anyFailed = false;
  for (const [i, batch] of batches.entries()) {
    console.log(`\nRunning batch ${i + 1}/${batches.length}: ${batch.map(c => c.id).join(", ")}`);
    const results = await Promise.allSettled(batch.map(card => processCard(card.id)));
    results.forEach((result, idx) => {
      const id = batch[idx].id;
      if (result.status === "rejected" || !result.value.ok) {
        anyFailed = true;
        console.error(`Card ${id} did not reach "review" — check swarm/logs/.`);
      }
    });
  }

  if (anyFailed) process.exitCode = 1;
}

main();
