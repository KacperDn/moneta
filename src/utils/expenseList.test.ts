import { describe, it, expect } from "vitest";
import { replaceExpense } from "./expenseList";
import { Expense } from "../types";

function expense(id: string, date: string, overrides: Partial<Expense> = {}): Expense {
  return { id, description: id, cat: "Inne", amount: 1, date, user_id: "u", created_at: "", ...overrides };
}

describe("replaceExpense", () => {
  it("swaps in the updated expense by id", () => {
    const list = [expense("a", "2025-03-01"), expense("b", "2025-02-01")];
    const result = replaceExpense(list, expense("b", "2025-02-01", { description: "changed" }));
    expect(result.find(e => e.id === "b")?.description).toBe("changed");
    expect(result).toHaveLength(2);
  });

  it("re-sorts newest first when the date changed", () => {
    const list = [expense("a", "2025-03-01"), expense("b", "2025-02-01")];
    const result = replaceExpense(list, expense("b", "2025-04-01"));
    expect(result.map(e => e.id)).toEqual(["b", "a"]);
  });

  it("leaves the list unchanged when the id is unknown", () => {
    const list = [expense("a", "2025-03-01")];
    expect(replaceExpense(list, expense("zzz", "2025-01-01"))).toEqual(list);
  });

  it("does not mutate the input list", () => {
    const list = [expense("a", "2025-03-01"), expense("b", "2025-02-01")];
    const snapshot = [...list];
    replaceExpense(list, expense("b", "2025-05-01"));
    expect(list).toEqual(snapshot);
  });
});
