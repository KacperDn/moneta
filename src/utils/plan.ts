import { Expense, PlanItem } from "../types";
import { fromCents, toCents } from "./money";

/** First day of a month as stored in plan_items.plan_month ("YYYY-MM-01"); `month` is 0-based. */
export function planMonth(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-01`;
}

export function previousMonth(year: number, month: number): { year: number; month: number } {
  return month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
}

export interface PlanSummary {
  income: number;
  planned: number;
  remaining: number;
  /** Share of the income already assigned, capped at 100 for progress bars. */
  plannedPct: number;
  overbooked: boolean;
}

export function summarizePlan(items: PlanItem[]): PlanSummary {
  let income = 0;
  let planned = 0;
  for (const item of items) {
    if (item.kind === "income") income += toCents(item.amount);
    else planned += toCents(item.amount);
  }

  const plannedPct = income > 0 ? Math.min(100, (planned / income) * 100) : planned > 0 ? 100 : 0;
  return {
    income: fromCents(income),
    planned: fromCents(planned),
    remaining: fromCents(income - planned),
    plannedPct,
    overbooked: planned > income,
  };
}

/** Actual spending in an expense category (case-insensitive, like the rest of the category handling). */
export function spentInCategory(expenses: Expense[], category: string): number {
  const wanted = category.toLowerCase();
  const cents = expenses
    .filter(e => e.cat.toLowerCase() === wanted)
    .reduce((total, e) => total + toCents(e.amount), 0);
  return fromCents(cents);
}

export interface Usage {
  /** Used share of the plan, capped at 100 for progress bars. */
  pct: number;
  over: boolean;
}

export function usage(planned: number, actual: number): Usage {
  if (planned <= 0) return { pct: actual > 0 ? 100 : 0, over: actual > 0 };
  return { pct: Math.min(100, Math.max(0, (actual / planned) * 100)), over: actual > planned };
}
