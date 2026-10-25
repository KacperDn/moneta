import { describe, it, expect } from "vitest";
import { sanitizeAmount, formatAmount, parseAmount } from "./amount";

describe("sanitizeAmount", () => {
  it("accepts a comma as the decimal separator", () => {
    expect(sanitizeAmount("12,5")).toBe("12.5");
  });

  it("strips letters and symbols", () => {
    expect(sanitizeAmount("a1b2-3zł")).toBe("123");
  });

  it("keeps only the first decimal separator", () => {
    expect(sanitizeAmount("1.2.3")).toBe("1.23");
  });

  it("limits decimals to two places", () => {
    expect(sanitizeAmount("9.999")).toBe("9.99");
  });

  it("caps the overall length", () => {
    expect(sanitizeAmount("12345678901234")).toBe("1234567890");
  });

  it("allows a trailing dot while the user is still typing", () => {
    expect(sanitizeAmount("5.")).toBe("5.");
  });

  it("returns an empty string for empty input", () => {
    expect(sanitizeAmount("")).toBe("");
  });
});

describe("formatAmount", () => {
  it("never returns a negative amount", () => {
    expect(formatAmount(-3)).toBe("0");
  });

  it("rounds floating-point drift to cents", () => {
    expect(formatAmount(0.1 + 0.2)).toBe("0.3");
  });

  it("drops trailing zeros", () => {
    expect(formatAmount(10)).toBe("10");
  });
});

describe("parseAmount", () => {
  it("returns the number for a valid positive amount", () => {
    expect(parseAmount("12.5")).toBe(12.5);
  });

  it("rejects empty, zero and negative input", () => {
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("0")).toBeNull();
    expect(parseAmount("-5")).toBeNull();
  });

  it("rejects amounts the database would refuse", () => {
    expect(parseAmount("1000000000")).toBeNull();
    expect(parseAmount("999999999.99")).toBe(999999999.99);
  });
});

