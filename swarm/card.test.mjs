import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { readCard, setCardStatus, findCardById } from "./card.mjs";

const CARD = `---
id: 007
title: Sample card
status: ready
files:
  - src/a.ts
  - src/a.test.ts
verify: npm test -- --run a
---
Body text.

Acceptance criteria:
- works
`;

let dir;
beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), "card-"));
  writeFileSync(path.join(dir, "007-sample.md"), CARD);
  writeFileSync(path.join(dir, "_template.md"), CARD.replace("007", "000"));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe("readCard", () => {
  it("parses scalar fields, the files list and the body", () => {
    const card = readCard(path.join(dir, "007-sample.md"));
    expect(card).toMatchObject({
      id: "007",
      title: "Sample card",
      status: "ready",
      files: ["src/a.ts", "src/a.test.ts"],
      verify: "npm test -- --run a",
    });
    expect(card.body).toContain("Acceptance criteria:");
  });

  it("throws when the frontmatter block is missing", () => {
    writeFileSync(path.join(dir, "bad.md"), "no frontmatter");
    expect(() => readCard(path.join(dir, "bad.md"))).toThrow(/missing frontmatter/);
  });

  it("throws when required fields are missing", () => {
    writeFileSync(path.join(dir, "bad.md"), "---\ntitle: x\n---\nbody");
    expect(() => readCard(path.join(dir, "bad.md"))).toThrow(/must have id, status/);
  });
});

describe("setCardStatus", () => {
  it("rewrites only the status line", () => {
    const file = path.join(dir, "007-sample.md");
    setCardStatus(file, "review");
    expect(readFileSync(file, "utf8")).toBe(CARD.replace("status: ready", "status: review"));
  });
});

describe("findCardById", () => {
  it("finds a card by id and ignores underscore-prefixed templates", () => {
    expect(findCardById(dir, "007")?.title).toBe("Sample card");
    expect(findCardById(dir, "000")).toBeNull();
  });
});
