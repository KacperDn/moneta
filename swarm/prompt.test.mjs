import { describe, it, expect } from "vitest";
import { parseFileBlocks, parseReviewVerdict } from "./prompt.mjs";

describe("parseFileBlocks", () => {
  it("parses multiple file blocks", () => {
    const text = "### FILE: a.ts\nconst a = 1;\n### END FILE\n\n### FILE: b.ts\nconst b = 2;\n### END FILE";
    expect([...parseFileBlocks(text)]).toEqual([
      ["a.ts", "const a = 1;"],
      ["b.ts", "const b = 2;"],
    ]);
  });

  it("strips a markdown code fence the model added around the content", () => {
    const text = "### FILE: a.ts\n```ts\nconst a = 1;\n```\n### END FILE";
    expect(parseFileBlocks(text).get("a.ts")).toBe("const a = 1;");
  });

  it("returns an empty map when no block is present", () => {
    expect(parseFileBlocks("Sure, here is the code...").size).toBe(0);
  });
});

describe("parseReviewVerdict", () => {
  it("parses an approve verdict", () => {
    expect(parseReviewVerdict('{"verdict":"approve","comments":[]}')).toEqual({ verdict: "approve", comments: [] });
  });

  it("tolerates a fenced JSON response", () => {
    const result = parseReviewVerdict('```json\n{"verdict":"reject","comments":["add edge cases"]}\n```');
    expect(result).toEqual({ verdict: "reject", comments: ["add edge cases"] });
  });

  it("rejects an unrecognized verdict", () => {
    expect(() => parseReviewVerdict('{"verdict":"maybe"}')).toThrow(/unrecognized verdict/);
  });

  it("defaults comments to an empty list when missing", () => {
    expect(parseReviewVerdict('{"verdict":"approve"}').comments).toEqual([]);
  });
});
