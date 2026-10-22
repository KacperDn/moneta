import { Expense } from "../types";

/** "YYYY-MM" key derived from an expense's date, used to group entries by calendar month. */
export function monthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Sums expense amounts per month key, rounded to 2 decimals to avoid
 * floating-point drift (e.g. 0.1 + 0.2). Keys are returned sorted ascending.
 */
export function sumByMonth(expenses: Expense[]): Array<{ key: string; total: number }> {
  const totals: Record<string, number> = {};
  for (const e of expenses) {
    const key = monthKey(e.date);
    totals[key] = (totals[key] || 0) + parseFloat(String(e.amount));
  }
  return Object.entries(totals)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, total]) => ({ key, total: parseFloat(total.toFixed(2)) }));
}

/** Sums expense amounts per category name, rounded to 2 decimals. */
export function sumByCategory(expenses: Expense[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const e of expenses) {
    totals[e.cat] = (totals[e.cat] || 0) + parseFloat(String(e.amount));
  }
  for (const cat of Object.keys(totals)) {
    totals[cat] = parseFloat(totals[cat].toFixed(2));
  }
  return totals;
}
