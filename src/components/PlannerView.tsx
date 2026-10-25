import { ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { fmt } from "../constants";
import { IconPiggyBank, IconWallet } from "../icons";
import { getCategoryIcon } from "../categoryIcons";
import { Expense, PlanItem, PlanItemForm, PlanKind, UserCategory } from "../types";
import { usePlan } from "../hooks/usePlan";
import { useSavings } from "../hooks/useSavings";
import { revealProps } from "../hooks/useScrollReveal";
import { spentInCategory, summarizePlan, usage } from "../utils/plan";
import { monthNet } from "../utils/savings";
import PlanItemDialog from "./PlanItemDialog";
import LoadError from "./LoadError";
import Skeleton from "./Skeleton";

interface PlannerViewProps {
  userId: string;
  year: number;
  month: number;
  monthLabel: string;
  monthExpenses: Expense[];
  categories: UserCategory[];
  getCategory: (name: string) => UserCategory;
  categoryLabel: (name: string) => string;
}

interface RowProgress {
  label: string | null;
  pct: number;
  over: boolean;
  icon: ReactNode;
  color: string;
}

/** Soft background tint for an icon badge, derived from its accent color. */
function tint(color: string): string {
  return `color-mix(in srgb, ${color} 14%, transparent)`;
}

interface DialogState {
  kind: PlanKind;
  item?: PlanItem;
}

export default function PlannerView({
  userId, year, month, monthLabel, monthExpenses, categories, getCategory, categoryLabel,
}: PlannerViewProps) {
  const { t } = useTranslation();
  const plan = usePlan(userId, year, month);
  const savings = useSavings(userId);
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const summary = summarizePlan(plan.items);
  const incomes = plan.items.filter(i => i.kind === "income");
  const allocations = plan.items.filter(i => i.kind === "allocation");
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;

  const handleSave = async (form: PlanItemForm) => {
    if (!dialog) return;
    const ok = dialog.item
      ? await plan.updateItem(dialog.item.id, form)
      : await plan.addItem(dialog.kind, form);
    if (ok) setDialog(null);
  };

  const handleDelete = async () => {
    if (!dialog?.item) return;
    await plan.removeItem(dialog.item.id);
    setDialog(null);
  };

  /** Plan vs. reality for one allocation: category spending from history, or net deposits into the linked goal. */
  const progressFor = (item: PlanItem): RowProgress => {
    if (item.category) {
      const category = getCategory(item.category);
      const spent = spentInCategory(monthExpenses, item.category);
      return {
        label: t("plan.spentOf", { spent: fmt(spent), planned: fmt(item.amount) }),
        ...usage(item.amount, spent),
        icon: getCategoryIcon(category.icon),
        color: category.color,
      };
    }

    const goal = savings.goals.find(g => g.id === item.savings_goal_id);
    if (goal) {
      const saved = monthNet(savings.entries, goal.id, monthKey);
      return {
        label: t("plan.savedOf", { goal: goal.name, saved: fmt(saved), planned: fmt(item.amount) }),
        pct: usage(item.amount, saved).pct,
        over: false,
        icon: IconPiggyBank,
        color: "var(--accent)",
      };
    }

    return { label: null, pct: 0, over: false, icon: IconWallet, color: "var(--muted)" };
  };

  if (plan.loading || savings.loading) return <Skeleton />;
  if (plan.loadFailed || savings.loadFailed) return <LoadError onRetry={() => { plan.reload(); savings.reload(); }} />;

  const remainingClass = summary.overbooked ? " plan__pool-value--over" : "";

  return (
    <div className="plan">
      <div className="plan__head">
        <div>
          <div className="page__title">{t("plan.title")}</div>
          <div className="page__subtitle page__subtitle--spaced">{monthLabel}</div>
        </div>
        {plan.items.length === 0 && (
          <button type="button" className="btn--ghost" onClick={plan.copyFromPreviousMonth} disabled={plan.saving}>
            {t("plan.copyPrevious")}
          </button>
        )}
      </div>

      <section className="plan__pool" {...revealProps()}>
        <div className="plan__pool-label">{t("plan.poolLabel")}</div>
        <div className={`plan__pool-value${remainingClass}`}>{fmt(summary.remaining)}<span>zł</span></div>
        <div className="plan__pool-track">
          <div
            className={`plan__pool-fill${summary.overbooked ? " plan__pool-fill--over" : ""}`}
            style={{ width: `${summary.plannedPct}%` }}
          />
        </div>
        <div className="plan__pool-meta">
          <span>{t("plan.income")}: <strong>{fmt(summary.income)} zł</strong></span>
          <span>{t("plan.planned")}: <strong>{fmt(summary.planned)} zł</strong></span>
        </div>
        {summary.overbooked && (
          <div className="plan__warning">{t("plan.overbooked", { amount: fmt(Math.abs(summary.remaining)) })}</div>
        )}
      </section>

      <div className="plan__columns">
        <section className="plan__column" {...revealProps(1)}>
          <div className="card__title">{t("plan.incomeTitle")}</div>
          {incomes.length === 0
            ? <div className="plan__empty">{t("plan.incomeEmpty")}</div>
            : (
              <div className="card card--list">
                {incomes.map(item => (
                  <div key={item.id} className="list__row">
                    <button type="button" className="list__main" onClick={() => setDialog({ kind: "income", item })}>
                      <span className="list__info"><span className="list__desc">{item.label}</span></span>
                      <span className="list__amount plan__income-amount">+{fmt(item.amount)} zł</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          <button type="button" className="plan__add" onClick={() => setDialog({ kind: "income" })}>{t("plan.addIncome")}</button>
        </section>

        <section className="plan__column" {...revealProps(2)}>
          <div className="card__title">{t("plan.allocationTitle")}</div>
          {allocations.length === 0
            ? <div className="plan__empty">{t("plan.allocationEmpty")}</div>
            : (
              <div className="card card--list">
                {allocations.map(item => {
                  const progress = progressFor(item);
                  return (
                    <div key={item.id} className="list__row plan__row">
                      <button type="button" className="list__main" onClick={() => setDialog({ kind: "allocation", item })}>
                        <span className="list__icon" style={{ background: tint(progress.color), color: progress.color }}>{progress.icon}</span>
                        <span className="list__info">
                          <span className="list__desc">{item.label}</span>
                          {progress.label && (
                            <>
                              <span className={`list__meta${progress.over ? " plan__meta--over" : ""}`}>{progress.label}</span>
                              <span className="plan__bar"><span className={`plan__bar-fill${progress.over ? " plan__bar-fill--over" : ""}`} style={{ width: `${progress.pct}%` }} /></span>
                            </>
                          )}
                        </span>
                        <span className="list__amount">{fmt(item.amount)} zł</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          <button type="button" className="plan__add" onClick={() => setDialog({ kind: "allocation" })}>{t("plan.addAllocation")}</button>
        </section>
      </div>

      {dialog && (
        <PlanItemDialog
          key={dialog.item?.id ?? dialog.kind}
          kind={dialog.kind}
          item={dialog.item}
          categories={categories}
          goals={savings.goals}
          categoryLabel={categoryLabel}
          saving={plan.saving}
          onSave={handleSave}
          onDelete={dialog.item ? handleDelete : undefined}
          onCancel={() => setDialog(null)}
        />
      )}
    </div>
  );
}
