import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;

/**
 * Parses the small frontmatter subset our cards use: scalar `key: value`
 * lines and one list (`files:` followed by `  - item` lines). Not a general
 * YAML parser — kept intentionally narrow to avoid a dependency.
 */
function parseFrontmatter(raw) {
  const data = {};
  let currentKey = null;
  for (const line of raw.split(/\r?\n/)) {
    const listItem = line.match(/^\s+-\s+(.+)$/);
    if (listItem && currentKey) {
      (data[currentKey] ??= []).push(listItem[1].trim());
      continue;
    }
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) {
      currentKey = kv[1];
      const value = kv[2].trim();
      if (value) data[currentKey] = value;
    }
  }
  return data;
}

export function readCard(filePath) {
  const raw = readFileSync(filePath, "utf8");
  const match = raw.match(FRONTMATTER_RE);
  if (!match) throw new Error(`${filePath}: missing frontmatter block`);

  const [, frontmatterRaw, body] = match;
  const data = parseFrontmatter(frontmatterRaw);

  if (!data.id || !data.status || !Array.isArray(data.files)) {
    throw new Error(`${filePath}: frontmatter must have id, status, and a files list`);
  }

  return {
    path: filePath,
    id: data.id,
    title: data.title ?? data.id,
    status: data.status,
    files: data.files,
    verify: data.verify,
    body: body.trim(),
  };
}

/** Rewrites only the `status:` line, leaving the rest of the card untouched. */
export function setCardStatus(filePath, newStatus) {
  const raw = readFileSync(filePath, "utf8");
  const updated = raw.replace(/^status:\s*\w+/m, `status: ${newStatus}`);
  writeFileSync(filePath, updated);
}

export function findCardById(kanbanDir, id) {
  const files = readdirSync(kanbanDir).filter(f => f.endsWith(".md") && !f.startsWith("_"));
  for (const file of files) {
    const card = readCard(path.join(kanbanDir, file));
    if (card.id === id) return card;
  }
  return null;
}
