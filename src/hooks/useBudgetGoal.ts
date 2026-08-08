import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";

interface UseBudgetGoalReturn {
  goal: number | null;
  setGoal: (value: number | null) => Promise<void>;
}

export function useBudgetGoal(userId: string | undefined): UseBudgetGoalReturn {
  const { t } = useTranslation();
  const [goal, setGoalState] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) { setGoalState(null); return; }

    supabase
      .from("budgets")
      .select("monthly_goal")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) return toast.error(t("toast.budgetLoadFailed"));
        setGoalState(data?.monthly_goal ?? null);
      });
  }, [userId, t]);

  const setGoal = async (value: number | null) => {
    if (!userId) return;
    const previous = goal;
    setGoalState(value);

    const { error } = value === null
      ? await supabase.from("budgets").delete().eq("user_id", userId)
      : await supabase.from("budgets").upsert({ user_id: userId, monthly_goal: value });

    if (error) {
      setGoalState(previous);
      toast.error(t("toast.budgetSaveFailed"));
    }
  };

  return { goal, setGoal };
}
