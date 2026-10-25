import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import { SavingsEntry, SavingsGoal, SavingsGoalForm } from "../types";
import { fromCents, toCents } from "../utils/money";

interface UseSavingsReturn {
  goals: SavingsGoal[];
  entries: SavingsEntry[];
  loading: boolean;
  loadFailed: boolean;
  reload: () => void;
  saving: boolean;
  addGoal: (form: SavingsGoalForm) => Promise<boolean>;
  updateGoal: (id: string, form: SavingsGoalForm) => Promise<boolean>;
  removeGoal: (id: string) => Promise<void>;
  /** `amount` is signed: positive deposits, negative withdrawals. */
  addEntry: (goalId: string, amount: number, date: string, note: string) => Promise<boolean>;
  removeEntry: (id: string) => Promise<void>;
}

function goalRow(form: SavingsGoalForm) {
  const target = toCents(form.target);
  return {
    name: form.name.trim(),
    target_amount: target > 0 ? fromCents(target) : null,
  };
}

/** Savings goals ("piggy banks") and their deposit/withdrawal history. */
export function useSavings(userId: string | undefined): UseSavingsReturn {
  const { t } = useTranslation();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [entries, setEntries] = useState<SavingsEntry[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [failedFor, setFailedFor] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    Promise.all([
      supabase.from("savings_goals").select("*").order("created_at", { ascending: true }),
      supabase.from("savings_entries").select("*").order("entry_date", { ascending: false }).order("created_at", { ascending: false }),
    ]).then(([goalsResult, entriesResult]) => {
      if (cancelled) return;
      setFailedFor(goalsResult.error || entriesResult.error ? userId : null);
      setGoals((goalsResult.data as SavingsGoal[] | null) ?? []);
      setEntries((entriesResult.data as SavingsEntry[] | null) ?? []);
      setLoadedFor(userId);
    });

    return () => { cancelled = true; };
  }, [userId, reloadCount]);

  const reload = () => {
    setLoadedFor(null);
    setReloadCount(count => count + 1);
  };

  const addGoal = async (form: SavingsGoalForm): Promise<boolean> => {
    setSaving(true);
    const { data, error } = await supabase.from("savings_goals").insert(goalRow(form)).select().single();
    setSaving(false);

    if (error || !data) {
      toast.error(t("toast.savingsSaveFailed"));
      return false;
    }
    setGoals(prev => [...prev, data as SavingsGoal]);
    return true;
  };

  const updateGoal = async (id: string, form: SavingsGoalForm): Promise<boolean> => {
    setSaving(true);
    const { data, error } = await supabase.from("savings_goals").update(goalRow(form)).eq("id", id).select().single();
    setSaving(false);

    if (error || !data) {
      toast.error(t("toast.savingsSaveFailed"));
      return false;
    }
    setGoals(prev => prev.map(g => (g.id === id ? (data as SavingsGoal) : g)));
    return true;
  };

  const removeGoal = async (id: string) => {
    const { error } = await supabase.from("savings_goals").delete().eq("id", id);
    if (error) {
      toast.error(t("toast.savingsDeleteFailed"));
      return;
    }
    setGoals(prev => prev.filter(g => g.id !== id));
    setEntries(prev => prev.filter(e => e.goal_id !== id));
  };

  const addEntry = async (goalId: string, amount: number, date: string, note: string): Promise<boolean> => {
    setSaving(true);
    const { data, error } = await supabase
      .from("savings_entries")
      .insert({
        goal_id: goalId,
        amount: fromCents(toCents(amount)),
        entry_date: date,
        note: note.trim() || null,
      })
      .select()
      .single();
    setSaving(false);

    if (error || !data) {
      toast.error(t("toast.savingsSaveFailed"));
      return false;
    }
    setEntries(prev => [data as SavingsEntry, ...prev].sort((a, b) => b.entry_date.localeCompare(a.entry_date)));
    return true;
  };

  const removeEntry = async (id: string) => {
    const backup = entries;
    setEntries(prev => prev.filter(e => e.id !== id));

    const { error } = await supabase.from("savings_entries").delete().eq("id", id);
    if (error) {
      setEntries(backup);
      toast.error(t("toast.savingsDeleteFailed"));
    }
  };

  return {
    goals,
    entries,
    loading: userId !== undefined && loadedFor !== userId,
    loadFailed: userId !== undefined && failedFor === userId,
    reload,
    saving,
    addGoal,
    updateGoal,
    removeGoal,
    addEntry,
    removeEntry,
  };
}
