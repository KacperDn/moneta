const FILE_BLOCK_RE = /###\s*FILE:\s*(\S+)\s*\r?\n([\s\S]*?)\r?\n###\s*END FILE/g;

/** Strips a stray markdown code fence if the model wraps file content in one despite instructions. */
function stripCodeFence(content) {
  return content
    .replace(/^```[a-zA-Z0-9]*\r?\n/, "")
    .replace(/\r?\n```$/, "");
}

export function buildWorkerPrompt(agentsMd, card) {
  return `You are implementing a single task in an existing TypeScript/React codebase.
Follow every rule in AGENTS.md below. You may only create or modify the files
listed as allowed — nothing else.

=== AGENTS.md ===
${agentsMd}

=== TASK (kanban/${card.id}) ===
Title: ${card.title}

${card.body}

Allowed files (whitelist — do not touch anything else):
${card.files.map(f => `- ${f}`).join("\n")}

=== OUTPUT FORMAT ===
Respond with nothing but one block per file, in exactly this format, for
every file you create or modify:

### FILE: <path exactly as listed above>
<entire file content, final version, no markdown code fences>
### END FILE

Repeat for each file. No other text, explanation, or commentary.`;
}

export function buildFixPrompt(basePrompt, previousFiles, gateLogTail) {
  const previousFilesBlock = [...previousFiles.entries()]
    .map(([path, content]) => `### FILE: ${path}\n${content}\n### END FILE`)
    .join("\n\n");

  return `${basePrompt}

=== PREVIOUS ATTEMPT ===
You previously produced these files:

${previousFilesBlock}

Running the project's quality gate (lint, typecheck, tests, build) on that
attempt failed. Here is the end of the gate output:

${gateLogTail}

Fix the problem and resend the complete, corrected content for every file in
the whitelist, using the same FILE block format as before.`;
}

export function buildReviewerPrompt(card, diffText) {
  return `You are reviewing a single, isolated change against a task card. You did
not write this code. Be skeptical — check correctness, whether it actually
satisfies the acceptance criteria, and whether the tests are meaningful
(real edge cases and assertions on actual values) rather than trivial
placeholders (e.g. "function exists", assertions with no real expectation).

=== TASK (kanban/${card.id}) ===
Title: ${card.title}

${card.body}

=== DIFF TO REVIEW ===
${diffText}

=== OUTPUT FORMAT ===
Respond with nothing but a single JSON object, no markdown fences, no other
text:

{"verdict": "approve" | "reject", "comments": ["specific, actionable comment", ...]}

Use "reject" if any acceptance criterion is unmet, if the tests are trivial
or missing real edge cases, or if you see a correctness bug. "comments" must
be empty only when verdict is "approve".`;
}

export function buildReviewFixPrompt(basePrompt, currentFiles, reviewerComments) {
  const currentFilesBlock = [...currentFiles.entries()]
    .map(([path, content]) => `### FILE: ${path}\n${content}\n### END FILE`)
    .join("\n\n");

  return `${basePrompt}

=== CURRENT STATE (already passed the quality gate once) ===
${currentFilesBlock}

=== REVIEWER FEEDBACK ===
A reviewer rejected this version with the following feedback:

${reviewerComments.map(c => `- ${c}`).join("\n")}

Make the smallest change that addresses every point above without
reintroducing any problem the current state already avoids. Resend the
complete, corrected content for every file in the whitelist, using the same
FILE block format as before.`;
}

/** Parses the reviewer's JSON verdict, tolerating a stray markdown fence around it. */
export function parseReviewVerdict(responseText) {
  const cleaned = responseText.trim().replace(/^```[a-zA-Z]*\r?\n/, "").replace(/\r?\n```$/, "");
  const parsed = JSON.parse(cleaned);
  if (parsed.verdict !== "approve" && parsed.verdict !== "reject") {
    throw new Error(`Reviewer returned an unrecognized verdict: ${JSON.stringify(parsed.verdict)}`);
  }
  return { verdict: parsed.verdict, comments: Array.isArray(parsed.comments) ? parsed.comments : [] };
}

export function parseFileBlocks(responseText) {
  const files = new Map();
  let match;
  while ((match = FILE_BLOCK_RE.exec(responseText))) {
    const [, filePath, rawContent] = match;
    files.set(filePath.trim(), stripCodeFence(rawContent));
  }
  return files;
}
