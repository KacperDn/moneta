import { SavingsEntry } from "../types";
import { sumAmounts } from "./money";

export function goalBalance(entries: SavingsEntry[], goalId: string): number {
  return sumAmounts(entries.filter(e => e.goal_id === goalId).map(e => e.amount));
}

export function totalSavings(entries: SavingsEntry[]): number {
  return sumAmounts(entries.map(e => e.amount));
}

/** Net amount put into a goal during one calendar month ("YYYY-MM"); withdrawals count negatively. */
export function monthNet(entries: SavingsEntry[], goalId: string, monthKey: string): number {
  return sumAmounts(
    entries
      .filter(e => e.goal_id === goalId && e.entry_date.startsWith(monthKey))
      .map(e => e.amount),
  );
}

/** Progress toward a target, clamped to 0-100; null when the goal has no target. */
export function goalProgressPct(balance: number, target: number | null): number | null {
  if (target === null || target <= 0) return null;
  return Math.min(100, Math.max(0, (balance / target) * 100));
}
