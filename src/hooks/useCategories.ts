import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import { CATS } from "../constants";
import { UserCategory } from "../types";

interface CategoryRow {
  name: string;
  icon: string;
  color: string;
  hidden: boolean;
}

interface UseCategoriesReturn {
  categories: UserCategory[];
  loading: boolean;
  addCategory: (name: string, icon: string, color: string) => Promise<boolean>;
  updateCategory: (name: string, changes: Partial<Pick<UserCategory, "icon" | "color" | "hidden">>) => Promise<boolean>;
  deleteCategory: (name: string) => Promise<boolean>;
}

export function useCategories(userId: string | undefined): UseCategoriesReturn {
  const { t } = useTranslation();
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setRows([]); setLoading(false); return; }
    setLoading(true);
    supabase
      .from("categories")
      .select("name, icon, color, hidden")
      .eq("user_id", userId)
      .then(({ data, error }) => {
        if (error) toast.error(t("toast.categoriesLoadFailed"));
        setRows(data ?? []);
        setLoading(false);
      });
  }, [userId, t]);

  const categories = useMemo<UserCategory[]>(() => {
    const byLowerName = new Map(rows.map(r => [r.name.toLowerCase(), r]));
    const defaultNames = new Set(CATS.map(c => c.name.toLowerCase()));

    const defaults: UserCategory[] = CATS.map(c => {
      const override = byLowerName.get(c.name.toLowerCase());
      return {
        name: c.name,
        icon: override?.icon ?? c.icon,
        color: override?.color ?? c.color,
        hidden: override?.hidden ?? false,
        isDefault: true,
      };
    });

    const custom: UserCategory[] = rows
      .filter(r => !defaultNames.has(r.name.toLowerCase()))
      .map(r => ({ name: r.name, icon: r.icon, color: r.color, hidden: r.hidden, isDefault: false }));

    return [...defaults, ...custom];
  }, [rows]);

  const addCategory = async (name: string, icon: string, color: string): Promise<boolean> => {
    if (!userId) return false;
    const trimmed = name.trim();
    if (!trimmed) return false;

    const exists = categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      toast.error(t("toast.categoryNameTaken"));
      return false;
    }

    const { error } = await supabase.from("categories").insert({ user_id: userId, name: trimmed, icon, color, hidden: false });
    if (error) {
      toast.error(t("toast.categorySaveFailed"));
      return false;
    }

    setRows(prev => [...prev, { name: trimmed, icon, color, hidden: false }]);
    return true;
  };

  const updateCategory = async (name: string, changes: Partial<Pick<UserCategory, "icon" | "color" | "hidden">>): Promise<boolean> => {
    if (!userId) return false;
    const current = categories.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (!current) return false;

    const next = { icon: current.icon, color: current.color, hidden: current.hidden, ...changes };

    const { error } = await supabase
      .from("categories")
      .upsert(
        { user_id: userId, name: current.name, icon: next.icon, color: next.color, hidden: next.hidden },
        { onConflict: "user_id,name" }
      );

    if (error) {
      toast.error(t("toast.categorySaveFailed"));
      return false;
    }

    setRows(prev => {
      const idx = prev.findIndex(r => r.name.toLowerCase() === name.toLowerCase());
      const updated: CategoryRow = { name: current.name, icon: next.icon, color: next.color, hidden: next.hidden };
      if (idx === -1) return [...prev, updated];
      const copy = [...prev];
      copy[idx] = updated;
      return copy;
    });
    return true;
  };

  const deleteCategory = async (name: string): Promise<boolean> => {
    if (!userId) return false;
    const target = categories.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (!target || target.isDefault) return false;

    const { count } = await supabase
      .from("expenses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("cat", target.name);

    if (count && count > 0) {
      toast.error(t("toast.categoryHasExpenses"));
      return false;
    }

    const { error } = await supabase.from("categories").delete().eq("user_id", userId).eq("name", target.name);
    if (error) {
      toast.error(t("toast.categoryDeleteFailed"));
      return false;
    }

    setRows(prev => prev.filter(r => r.name.toLowerCase() !== name.toLowerCase()));
    return true;
  };

  return { categories, loading, addCategory, updateCategory, deleteCategory };
}
