import { useState, useEffect, useMemo } from "react";
import { Session } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import { Expense, ExpenseForm, MonthSummary } from "../types";

const MAX_RETRIES = 3;

interface UseExpensesReturn {
  expenses: Expense[];
  loading: boolean;
  saving: boolean;
  add: (form: ExpenseForm, userId: string) => Promise<boolean>;
  remove: (id: string) => Promise<void>;
  filtered: (month: number, year: number) => Expense[];
  byMonth: MonthSummary[];
}

export function useExpenses(session: Session | null): UseExpensesReturn {
  const { t, i18n } = useTranslation();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    if (!session) return;
    fetchData();
  }, [session]);

  const fetchData = async (attempt = 1) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      if (attempt < MAX_RETRIES) {
        setTimeout(() => fetchData(attempt + 1), attempt * 1000);
      } else {
        toast.error(t("toast.fetchFailed"));
        setLoading(false);
      }
      return;
    }

    setExpenses(data || []);
    setLoading(false);
  };

  const add = async (form: ExpenseForm, userId: string): Promise<boolean> => {
    setSaving(true);
    const { data, error } = await supabase
      .from("expenses")
      .insert({
        description: form.desc,
        cat: form.cat,
        amount: parseFloat(form.amount),
        date: form.date,
        user_id: userId,
      })
      .select()
      .single();

    if (error || !data) {
      toast.error(t("toast.expenseSaveFailed"));
      setSaving(false);
      return false;
    }

    setExpenses(prev => [data, ...prev]);
    toast.success(t("toast.expenseAdded"));
    setSaving(false);
    return true;
  };

  const remove = async (id: string) => {
    const backup = expenses.find(e => e.id === id);
    setExpenses(prev => prev.filter(e => e.id !== id));

    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) {
      if (backup) setExpenses(prev => [backup, ...prev]);
      toast.error(t("toast.expenseDeleteFailed"));
      return;
    }
    toast.success(t("toast.expenseDeleted"));
  };

  const filtered = (month: number, year: number) =>
    expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });

  const byMonth = useMemo<MonthSummary[]>(() => {
    const months = t("months", { returnObjects: true }) as string[];
    const m: Record<string, number> = {};
    expenses.forEach(e => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      m[key] = (m[key] || 0) + parseFloat(String(e.amount));
    });
    return Object.entries(m)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, total]) => ({
        key,
        label: months[parseInt(key.split("-")[1]) - 1].slice(0, 3),
        total: parseFloat(total.toFixed(2)),
      }));
  }, [expenses, i18n.language, t]);

  return { expenses, loading, saving, add, remove, filtered, byMonth };
}
