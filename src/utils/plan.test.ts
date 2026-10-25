import { describe, it, expect } from "vitest";
import { planMonth, previousMonth, summarizePlan, spentInCategory, usage } from "./plan";
import { Expense, PlanItem } from "../types";

function item(kind: PlanItem["kind"], amount: number): PlanItem {
  return { id: "1", user_id: "u", plan_month: "2025-03-01", kind, label: "x", amount, category: null, savings_goal_id: null, created_at: "" };
}

function expense(cat: string, amount: number): Expense {
  return { id: "1", description: "x", cat, amount, date: "2025-03-05", user_id: "u", created_at: "" };
}

describe("planMonth", () => {
  it("formats a 0-based month as the first day of the month", () => {
    expect(planMonth(2025, 0)).toBe("2025-01-01");
    expect(planMonth(2025, 11)).toBe("2025-12-01");
  });
});

describe("previousMonth", () => {
  it("steps back within a year", () => {
    expect(previousMonth(2025, 5)).toEqual({ year: 2025, month: 4 });
  });

  it("wraps January to December of the previous year", () => {
    expect(previousMonth(2025, 0)).toEqual({ year: 2024, month: 11 });
  });
});

describe("summarizePlan", () => {
  it("subtracts planned allocations from the income pool", () => {
    const summary = summarizePlan([item("income", 8000), item("allocation", 2000), item("allocation", 1500)]);
    expect(summary).toMatchObject({ income: 8000, planned: 3500, remaining: 4500, overbooked: false });
    expect(summary.plannedPct).toBeCloseTo(43.75);
  });

  it("flags an overbooked plan and caps the progress at 100", () => {
    const summary = summarizePlan([item("income", 1000), item("allocation", 1200)]);
    expect(summary.remaining).toBe(-200);
    expect(summary.overbooked).toBe(true);
    expect(summary.plannedPct).toBe(100);
  });

  it("is empty-safe", () => {
    expect(summarizePlan([])).toEqual({ income: 0, planned: 0, remaining: 0, plannedPct: 0, overbooked: false });
  });

  it("treats planned money without any income as fully overbooked", () => {
    const summary = summarizePlan([item("allocation", 50)]);
    expect(summary.plannedPct).toBe(100);
    expect(summary.overbooked).toBe(true);
  });

  it("does not drift on decimal amounts", () => {
    const summary = summarizePlan([item("income", 0.3), item("allocation", 0.1), item("allocation", 0.2)]);
    expect(summary.remaining).toBe(0);
    expect(summary.overbooked).toBe(false);
  });
});

describe("spentInCategory", () => {
  it("sums only the matching category, ignoring letter case", () => {
    const expenses = [expense("Jedzenie", 20.5), expense("jedzenie", 10), expense("Transport", 99)];
    expect(spentInCategory(expenses, "JEDZENIE")).toBe(30.5);
  });

  it("returns 0 when nothing matches", () => {
    expect(spentInCategory([expense("Inne", 5)], "Zdrowie")).toBe(0);
  });
});

describe("usage", () => {
  it("reports the used share of a plan", () => {
    expect(usage(200, 50)).toEqual({ pct: 25, over: false });
  });

  it("flags overspending and caps the bar at 100", () => {
    expect(usage(100, 130)).toEqual({ pct: 100, over: true });
  });

  it("handles a zero plan", () => {
    expect(usage(0, 0)).toEqual({ pct: 0, over: false });
    expect(usage(0, 10)).toEqual({ pct: 100, over: true });
  });
});
