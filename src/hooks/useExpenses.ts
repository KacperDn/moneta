import { useState, useEffect, useMemo, useCallback } from "react";
import { Session } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import { Expense, ExpenseForm, MonthSummary } from "../types";
import { sumByMonth } from "../utils/expenseStats";
import { replaceExpense } from "../utils/expenseList";

const MAX_RETRIES = 3;

interface UseExpensesReturn {
  expenses: Expense[];
  loading: boolean;
  saving: boolean;
  add: (form: ExpenseForm, userId: string) => Promise<boolean>;
  update: (id: string, form: ExpenseForm) => Promise<boolean>;
  remove: (id: string) => Promise<void>;
  filtered: (month: number, year: number) => Expense[];
  byMonth: MonthSummary[];
}

export function useExpenses(session: Session | null): UseExpensesReturn {
  const { t } = useTranslation();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);

  const fetchData = useCallback(async function fetchData(attempt = 1): Promise<void> {
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
  }, [t]);

  useEffect(() => {
    if (!session) return;
    fetchData();
  }, [session, fetchData]);

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

  const update = async (id: string, form: ExpenseForm): Promise<boolean> => {
    setSaving(true);
    // .select().single() turns a silently RLS-filtered update (0 rows) into an error.
    const { data, error } = await supabase
      .from("expenses")
      .update({
        description: form.desc,
        cat: form.cat,
        amount: parseFloat(form.amount),
        date: form.date,
      })
      .eq("id", id)
      .select()
      .single();

    setSaving(false);
    if (error || !data) {
      toast.error(t("toast.expenseUpdateFailed"));
      return false;
    }

    setExpenses(prev => replaceExpense(prev, data));
    toast.success(t("toast.expenseUpdated"));
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
    return sumByMonth(expenses).map(({ key, total }) => ({
      key,
      label: months[parseInt(key.split("-")[1]) - 1].slice(0, 3),
      total,
    }));
  }, [expenses, t]);

  return { expenses, loading, saving, add, update, remove, filtered, byMonth };
}
