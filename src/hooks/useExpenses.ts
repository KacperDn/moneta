import { useState, useEffect, useMemo } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { Expense, ExpenseForm, MonthSummary } from "../types";
import { MONTHS } from "../constants";

interface UseExpensesReturn {
  expenses: Expense[];
  loading: boolean;
  saving: boolean;
  error: string;
  add: (form: ExpenseForm, userId: string) => Promise<boolean>;
  remove: (id: string) => Promise<void>;
  filtered: (month: number, year: number) => Expense[];
  byMonth: MonthSummary[];
}

export function useExpenses(session: Session | null): UseExpensesReturn {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => {
    if (!session) return;
    fetch();
  }, [session]);

  const fetch = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("date", { ascending: false });
    if (error) setError("Błąd pobierania danych.");
    else setExpenses(data || []);
    setLoading(false);
  };

  const add = async (form: ExpenseForm, userId: string): Promise<boolean> => {
    setSaving(true);
    setError("");
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
      setError("Błąd zapisu wydatku.");
      setSaving(false);
      return false;
    }

    setExpenses(prev => [data, ...prev]);
    setSaving(false);
    return true;
  };

  const remove = async (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) {
      setError("Błąd usuwania wydatku.");
      fetch();
    }
  };

  const filtered = (month: number, year: number) =>
    expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });

  const byMonth = useMemo<MonthSummary[]>(() => {
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
        label: MONTHS[parseInt(key.split("-")[1]) - 1].slice(0, 3),
        total: parseFloat(total.toFixed(2)),
      }));
  }, [expenses]);

  return { expenses, loading, saving, error, add, remove, filtered, byMonth };
}