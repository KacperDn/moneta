import { Expense } from "../types";

/** Replaces the expense with the same id and keeps the list ordered newest-first by date. */
export function replaceExpense(list: Expense[], updated: Expense): Expense[] {
  return list
    .map(e => (e.id === updated.id ? updated : e))
    .sort((a, b) => b.date.localeCompare(a.date));
}
