import { describe, it, expect } from "vitest";
import { monthKey, sumByMonth, sumByCategory } from "./expenseStats";
import { Expense } from "../types";

function expense(overrides: Partial<Expense>): Expense {
  return {
    id: "1",
    description: "test",
    cat: "Jedzenie",
    amount: 10,
    date: "2024-01-15",
    user_id: "u1",
    created_at: "2024-01-15T00:00:00Z",
    ...overrides,
  };
}

describe("monthKey", () => {
  it("pads single-digit months with a leading zero", () => {
    expect(monthKey("2024-03-05")).toBe("2024-03");
  });

  it("does not pad two-digit months", () => {
    expect(monthKey("2024-11-30")).toBe("2024-11");
  });
});

describe("sumByMonth", () => {
  it("groups and sums expenses that fall in the same month", () => {
    const expenses = [
      expense({ date: "2024-01-05", amount: 10 }),
      expense({ date: "2024-01-20", amount: 15.5 }),
      expense({ date: "2024-02-01", amount: 7 }),
    ];

    expect(sumByMonth(expenses)).toEqual([
      { key: "2024-01", total: 25.5 },
      { key: "2024-02", total: 7 },
    ]);
  });

  it("returns months sorted ascending regardless of input order", () => {
    const expenses = [
      expense({ date: "2024-03-01", amount: 1 }),
      expense({ date: "2024-01-01", amount: 1 }),
      expense({ date: "2024-02-01", amount: 1 }),
    ];

    expect(sumByMonth(expenses).map(m => m.key)).toEqual(["2024-01", "2024-02", "2024-03"]);
  });

  it("rounds to 2 decimals to avoid floating-point drift", () => {
    const expenses = [
      expense({ date: "2024-01-01", amount: 0.1 }),
      expense({ date: "2024-01-02", amount: 0.2 }),
    ];

    expect(sumByMonth(expenses)).toEqual([{ key: "2024-01", total: 0.3 }]);
  });

  it("returns an empty array for no expenses", () => {
    expect(sumByMonth([])).toEqual([]);
  });

  it("treats amounts stored as strings the same as numbers", () => {
    const expenses = [expense({ date: "2024-01-01", amount: "12.5" as unknown as number })];
    expect(sumByMonth(expenses)).toEqual([{ key: "2024-01", total: 12.5 }]);
  });
});

describe("sumByCategory", () => {
  it("sums amounts per category, ignoring unrelated categories", () => {
    const expenses = [
      expense({ cat: "Jedzenie", amount: 20 }),
      expense({ cat: "Transport", amount: 5 }),
      expense({ cat: "Jedzenie", amount: 30 }),
    ];

    expect(sumByCategory(expenses)).toEqual({ Jedzenie: 50, Transport: 5 });
  });

  it("returns an empty object for no expenses", () => {
    expect(sumByCategory([])).toEqual({});
  });
});
