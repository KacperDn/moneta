import { describe, it, expect } from "vitest";
import { todayISO } from "./date";

describe("todayISO", () => {
  it("formats the local calendar date with zero padding", () => {
    expect(todayISO(new Date(2025, 0, 5, 12, 0))).toBe("2025-01-05");
  });

  it("uses the local date late in the evening, not the UTC one", () => {
    expect(todayISO(new Date(2025, 11, 31, 23, 59))).toBe("2025-12-31");
  });

  it("uses the local date just after midnight", () => {
    expect(todayISO(new Date(2025, 2, 1, 0, 5))).toBe("2025-03-01");
  });
});
