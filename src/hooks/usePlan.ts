import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import { PlanItem, PlanItemForm, PlanKind } from "../types";
import { fromCents, toCents } from "../utils/money";
import { planMonth, previousMonth } from "../utils/plan";

interface UsePlanReturn {
  items: PlanItem[];
  loading: boolean;
  loadFailed: boolean;
  reload: () => void;
  saving: boolean;
  addItem: (kind: PlanKind, form: PlanItemForm) => Promise<boolean>;
  updateItem: (id: string, form: PlanItemForm) => Promise<boolean>;
  removeItem: (id: string) => Promise<void>;
  copyFromPreviousMonth: () => Promise<void>;
}

function toRow(form: PlanItemForm) {
  return {
    label: form.label.trim(),
    amount: fromCents(toCents(form.amount)),
    category: form.category,
    savings_goal_id: form.savingsGoalId,
  };
}

/** Income and planned spending for one calendar month (`month` is 0-based). */
export function usePlan(userId: string | undefined, year: number, month: number): UsePlanReturn {
  const { t } = useTranslation();
  const monthDate = planMonth(year, month);
  const key = userId ? `${userId}:${monthDate}` : null;

  const [items, setItems] = useState<PlanItem[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    supabase
      .from("plan_items")
      .select("*")
      .eq("plan_month", monthDate)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        const loaded = `${userId}:${monthDate}`;
        setFailedKey(error ? loaded : null);
        setItems((data as PlanItem[] | null) ?? []);
        setLoadedKey(loaded);
      });

    return () => { cancelled = true; };
  }, [userId, monthDate, reloadCount]);

  const reload = () => {
    setLoadedKey(null);
    setReloadCount(count => count + 1);
  };

  const addItem = async (kind: PlanKind, form: PlanItemForm): Promise<boolean> => {
    setSaving(true);
    const { data, error } = await supabase
      .from("plan_items")
      .insert({ ...toRow(form), kind, plan_month: monthDate })
      .select()
      .single();
    setSaving(false);

    if (error || !data) {
      toast.error(t("toast.planSaveFailed"));
      return false;
    }
    setItems(prev => [...prev, data as PlanItem]);
    return true;
  };

  const updateItem = async (id: string, form: PlanItemForm): Promise<boolean> => {
    setSaving(true);
    // .select().single() turns a silently RLS-filtered update (0 rows) into an error.
    const { data, error } = await supabase
      .from("plan_items")
      .update(toRow(form))
      .eq("id", id)
      .select()
      .single();
    setSaving(false);

    if (error || !data) {
      toast.error(t("toast.planSaveFailed"));
      return false;
    }
    setItems(prev => prev.map(i => (i.id === id ? (data as PlanItem) : i)));
    return true;
  };

  const removeItem = async (id: string) => {
    const backup = items;
    setItems(prev => prev.filter(i => i.id !== id));

    const { error } = await supabase.from("plan_items").delete().eq("id", id);
    if (error) {
      setItems(backup);
      toast.error(t("toast.planDeleteFailed"));
    }
  };

  /** Recurring lines (salary, rent, ...) rarely change, so a new month can start from the last one. */
  const copyFromPreviousMonth = async () => {
    const previous = previousMonth(year, month);
    setSaving(true);

    const { data: source, error: readError } = await supabase
      .from("plan_items")
      .select("kind, label, amount, category, savings_goal_id")
      .eq("plan_month", planMonth(previous.year, previous.month));

    if (readError) {
      setSaving(false);
      toast.error(t("toast.planSaveFailed"));
      return;
    }
    if (!source || source.length === 0) {
      setSaving(false);
      toast(t("toast.planNothingToCopy"));
      return;
    }

    const { data, error } = await supabase
      .from("plan_items")
      .insert(source.map(row => ({ ...row, plan_month: monthDate })))
      .select();
    setSaving(false);

    if (error || !data) {
      toast.error(t("toast.planSaveFailed"));
      return;
    }
    setItems(prev => [...prev, ...(data as PlanItem[])]);
    toast.success(t("toast.planCopied"));
  };

  return {
    items,
    loading: key !== null && loadedKey !== key,
    loadFailed: key !== null && failedKey === key,
    reload,
    saving,
    addItem,
    updateItem,
    removeItem,
    copyFromPreviousMonth,
  };
}
