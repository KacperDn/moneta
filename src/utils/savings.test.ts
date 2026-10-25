import { describe, it, expect } from "vitest";
import { goalBalance, totalSavings, monthNet, goalProgressPct } from "./savings";
import { SavingsEntry } from "../types";

function entry(goal_id: string, amount: number, entry_date = "2025-03-10"): SavingsEntry {
  return { id: `${goal_id}-${amount}-${entry_date}`, user_id: "u", goal_id, entry_date, amount, note: null, created_at: "" };
}

const entries = [
  entry("a", 500, "2025-02-20"),
  entry("a", 300, "2025-03-05"),
  entry("a", -100, "2025-03-18"),
  entry("b", 1000, "2025-03-02"),
];

describe("goalBalance", () => {
  it("sums deposits and withdrawals for one goal only", () => {
    expect(goalBalance(entries, "a")).toBe(700);
    expect(goalBalance(entries, "b")).toBe(1000);
  });

  it("is zero for a goal without entries", () => {
    expect(goalBalance(entries, "zzz")).toBe(0);
  });
});

describe("totalSavings", () => {
  it("adds up every goal", () => {
    expect(totalSavings(entries)).toBe(1700);
  });
});

describe("monthNet", () => {
  it("counts only entries from the given month, withdrawals negatively", () => {
    expect(monthNet(entries, "a", "2025-03")).toBe(200);
  });

  it("ignores other goals and other months", () => {
    expect(monthNet(entries, "a", "2025-02")).toBe(500);
    expect(monthNet(entries, "b", "2025-02")).toBe(0);
  });
});

describe("goalProgressPct", () => {
  it("returns the percentage reached", () => {
    expect(goalProgressPct(250, 1000)).toBe(25);
  });

  it("caps at 100 and floors at 0", () => {
    expect(goalProgressPct(1500, 1000)).toBe(100);
    expect(goalProgressPct(-50, 1000)).toBe(0);
  });

  it("returns null when there is no target", () => {
    expect(goalProgressPct(250, null)).toBeNull();
  });
});
