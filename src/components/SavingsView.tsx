import { CSSProperties, useState } from "react";
import { useTranslation } from "react-i18next";
import { fmt } from "../constants";
import { IconPencil } from "../icons";
import { SavingsGoal, SavingsGoalForm } from "../types";
import { useSavings } from "../hooks/useSavings";
import { revealProps } from "../hooks/useScrollReveal";
import { goalBalance, goalProgressPct, totalSavings } from "../utils/savings";
import { ConfirmDeleteDialog } from "./Dialogs";
import { SavingsEntryDialog, SavingsGoalDialog } from "./SavingsDialogs";
import LoadError from "./LoadError";
import Skeleton from "./Skeleton";

const GOAL_COLORS = ["#a78bfa", "#22d3ee", "#f97316", "#10b981", "#ec4899", "#f59e0b", "#3b82f6", "#ef4444"];
const HISTORY_LIMIT = 8;

/** Deterministic per goal, so deleting another goal never recolors the rest. */
function goalColor(goalId: string): string {
  return GOAL_COLORS[parseInt(goalId.slice(0, 8), 16) % GOAL_COLORS.length];
}

type DialogState =
  | { type: "goal"; goal?: SavingsGoal }
  | { type: "entry"; mode: "deposit" | "withdraw"; goal: SavingsGoal };

export default function SavingsView({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const savings = useSavings(userId);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<SavingsGoal | null>(null);
  const [openHistory, setOpenHistory] = useState<Set<string>>(new Set());

  const toggleHistory = (goalId: string) => {
    setOpenHistory(prev => {
      const next = new Set(prev);
      if (next.has(goalId)) next.delete(goalId);
      else next.add(goalId);
      return next;
    });
  };

  const saveGoal = async (form: SavingsGoalForm) => {
    if (dialog?.type !== "goal") return;
    const ok = dialog.goal ? await savings.updateGoal(dialog.goal.id, form) : await savings.addGoal(form);
    if (ok) setDialog(null);
  };

  const saveEntry = async (amount: number, date: string, note: string) => {
    if (dialog?.type !== "entry") return;
    if (await savings.addEntry(dialog.goal.id, amount, date, note)) setDialog(null);
  };

  const confirmDeleteGoal = async () => {
    if (!goalToDelete) return;
    await savings.removeGoal(goalToDelete.id);
    setGoalToDelete(null);
  };

  if (savings.loading) return <Skeleton />;
  if (savings.loadFailed) return <LoadError onRetry={savings.reload} />;

  return (
    <div className="savings">
      <div className="plan__head">
        <div>
          <div className="page__title">{t("savings.title")}</div>
          <div className="page__subtitle page__subtitle--spaced">{t("savings.subtitle")}</div>
        </div>
        <button type="button" className="btn--ghost" onClick={() => setDialog({ type: "goal" })}>{t("savings.newGoal")}</button>
      </div>

      <section className="plan__pool" {...revealProps()}>
        <div className="plan__pool-label">{t("savings.totalLabel")}</div>
        <div className="plan__pool-value">{fmt(totalSavings(savings.entries))}<span>zł</span></div>
        <div className="plan__pool-meta">
          <span>{t("savings.goalsCount", { count: savings.goals.length })}</span>
        </div>
      </section>

      {savings.goals.length === 0
        ? (
          <div className="empty-state">
            <div className="empty-state__title">{t("savings.emptyTitle")}</div>
            <div className="empty-state__sub">{t("savings.emptySub")}</div>
            <button className="btn--primary empty-state__cta" onClick={() => setDialog({ type: "goal" })}>{t("savings.newGoal")}</button>
          </div>
        )
        : (
          <div className="savings__grid">
            {savings.goals.map((goal, index) => {
              const balance = goalBalance(savings.entries, goal.id);
              const progress = goalProgressPct(balance, goal.target_amount);
              const color = goalColor(goal.id);
              const history = savings.entries.filter(e => e.goal_id === goal.id);
              const historyOpen = openHistory.has(goal.id);
              const reveal = revealProps(index % 3);

              return (
                <article key={goal.id} className="goal" data-reveal="" style={{ ...reveal.style, "--goal-color": color } as CSSProperties}>
                  <header className="goal__head">
                    <span className="goal__dot" />
                    <span className="goal__name">{goal.name}</span>
                    <button type="button" className="goal__edit" onClick={() => setDialog({ type: "goal", goal })} aria-label={t("savings.editAria")}>
                      {IconPencil}
                    </button>
                  </header>

                  <div className="goal__balance">{fmt(balance)}<span>zł</span></div>

                  {progress !== null && goal.target_amount !== null && (
                    <>
                      <div className="plan__bar plan__bar--thick"><span className="plan__bar-fill goal__fill" style={{ width: `${progress}%` }} /></div>
                      <div className="goal__target">{t("savings.target", { amount: fmt(goal.target_amount), pct: Math.round(progress) })}</div>
                    </>
                  )}

                  <div className="goal__actions">
                    <button type="button" className="goal__btn goal__btn--primary" onClick={() => setDialog({ type: "entry", mode: "deposit", goal })}>
                      {t("savings.deposit")}
                    </button>
                    <button
                      type="button"
                      className="goal__btn"
                      disabled={balance <= 0}
                      onClick={() => setDialog({ type: "entry", mode: "withdraw", goal })}
                    >
                      {t("savings.withdraw")}
                    </button>
                  </div>

                  <button type="button" className="goal__history-toggle" onClick={() => toggleHistory(goal.id)} aria-expanded={historyOpen}>
                    {t("savings.history")} ({history.length})
                  </button>

                  {historyOpen && (history.length === 0
                    ? <div className="plan__empty">{t("savings.noEntries")}</div>
                    : (
                      <ul className="goal__history">
                        {history.slice(0, HISTORY_LIMIT).map(entry => (
                          <li key={entry.id} className="goal__entry">
                            <span className="goal__entry-main">
                              <span className="goal__entry-note">{entry.note ?? t(entry.amount > 0 ? "savings.dialog.deposit" : "savings.dialog.withdraw")}</span>
                              <span className="goal__entry-date">{entry.entry_date}</span>
                            </span>
                            <span className={`goal__entry-amount${entry.amount < 0 ? " goal__entry-amount--out" : ""}`}>
                              {entry.amount > 0 ? "+" : ""}{fmt(entry.amount)} zł
                            </span>
                            <button type="button" className="list__delete" onClick={() => savings.removeEntry(entry.id)} aria-label={t("savings.deleteEntryAria")}>×</button>
                          </li>
                        ))}
                      </ul>
                    ))}
                </article>
              );
            })}
          </div>
        )}

      {dialog?.type === "goal" && (
        <SavingsGoalDialog
          key={dialog.goal?.id ?? "new"}
          goal={dialog.goal}
          saving={savings.saving}
          onSave={saveGoal}
          onDelete={dialog.goal ? () => { setGoalToDelete(dialog.goal ?? null); setDialog(null); } : undefined}
          onCancel={() => setDialog(null)}
        />
      )}

      {dialog?.type === "entry" && (
        <SavingsEntryDialog
          mode={dialog.mode}
          goalName={dialog.goal.name}
          balance={goalBalance(savings.entries, dialog.goal.id)}
          saving={savings.saving}
          onSave={saveEntry}
          onCancel={() => setDialog(null)}
        />
      )}

      {goalToDelete && (
        <ConfirmDeleteDialog
          title={t("savings.deleteTitle")}
          body={t("savings.deleteBody", { name: goalToDelete.name })}
          onCancel={() => setGoalToDelete(null)}
          onConfirm={confirmDeleteGoal}
        />
      )}
    </div>
  );
}
