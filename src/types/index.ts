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