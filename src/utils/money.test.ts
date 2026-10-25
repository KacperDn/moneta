import { describe, it, expect } from "vitest";
import { toCents, fromCents, sumAmounts } from "./money";

describe("toCents", () => {
  it("converts numbers and numeric strings to integer cents", () => {
    expect(toCents(12.34)).toBe(1234);
    expect(toCents("12.34")).toBe(1234);
  });

  it("rounds floating-point noise instead of truncating it", () => {
    expect(toCents(0.29)).toBe(29);
    expect(toCents(19.99)).toBe(1999);
  });

  it("treats unparsable values as zero", () => {
    expect(toCents("abc")).toBe(0);
    expect(toCents("")).toBe(0);
  });
});

describe("fromCents", () => {
  it("converts cents back to a decimal amount", () => {
    expect(fromCents(1234)).toBe(12.34);
  });
});

describe("sumAmounts", () => {
  it("adds without floating-point drift", () => {
    expect(sumAmounts([0.1, 0.2])).toBe(0.3);
  });

  it("accepts a mix of numbers and numeric strings", () => {
    expect(sumAmounts([10, "5.50", 0.25])).toBe(15.75);
  });

  it("returns 0 for an empty list", () => {
    expect(sumAmounts([])).toBe(0);
  });

  it("supports negative amounts", () => {
    expect(sumAmounts([100, -40.5])).toBe(59.5);
  });
});
