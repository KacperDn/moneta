export interface Expense {
  id: string;
  description: string;
  cat: string;
  amount: number;
  date: string;
  user_id: string;
  created_at: string;
}

export interface Category {
  name: string;
  icon: string;
  color: string;
}

export interface UserCategory extends Category {
  hidden: boolean;
  isDefault: boolean;
}

export interface MonthSummary {
  key: string;
  label: string;
  total: number;
}

export interface ExpenseForm {
  desc: string;
  cat: string;
  amount: string;
  date: string;
}

export type PlanKind = "income" | "allocation";

/** One line of a monthly plan: an income source, or money earmarked for spending or saving. */
export interface PlanItem {
  id: string;
  user_id: string;
  plan_month: string;
  kind: PlanKind;
  label: string;
  amount: number;
  category: string | null;
  savings_goal_id: string | null;
  created_at: string;
}

export interface PlanItemForm {
  label: string;
  amount: string;
  category: string | null;
  savingsGoalId: string | null;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number | null;
  created_at: string;
}

export interface SavingsGoalForm {
  name: string;
  target: string;
}

/** A deposit (positive) or withdrawal (negative) on a savings goal. */
export interface SavingsEntry {
  id: string;
  user_id: string;
  goal_id: string;
  entry_date: string;
  amount: number;
  note: string | null;
  created_at: string;
}

export interface SavingsEntryForm {
  amount: string;
  date: string;
  note: string;
}