import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getCategoryIcon } from "../categoryIcons";
import { PlanItem, PlanItemForm, PlanKind, SavingsGoal, UserCategory } from "../types";
import { parseAmount } from "../utils/amount";
import AmountInput from "./AmountInput";
import DialogShell from "./DialogShell";

type Link = "none" | "category" | "goal";

interface PlanItemDialogProps {
  kind: PlanKind;
  item?: PlanItem;
  categories: UserCategory[];
  goals: SavingsGoal[];
  categoryLabel: (name: string) => string;
  saving: boolean;
  onSave: (form: PlanItemForm) => void;
  onDelete?: () => void;
  onCancel: () => void;
}

function initialLink(item?: PlanItem): Link {
  if (item?.category) return "category";
  if (item?.savings_goal_id) return "goal";
  return "none";
}

export default function PlanItemDialog({
  kind, item, categories, goals, categoryLabel, saving, onSave, onDelete, onCancel,
}: PlanItemDialogProps) {
  const { t } = useTranslation();
  const isIncome = kind === "income";

  const [label, setLabel] = useState(item?.label ?? "");
  const [amount, setAmount] = useState(item ? String(item.amount) : "");
  const [link, setLink] = useState<Link>(initialLink(item));
  const [category, setCategory] = useState<string | null>(item?.category ?? null);
  const [goalId, setGoalId] = useState<string | null>(item?.savings_goal_id ?? null);
  const [err, setErr] = useState("");

  const title = isIncome
    ? t(item ? "plan.dialog.incomeEdit" : "plan.dialog.incomeNew")
    : t(item ? "plan.dialog.allocationEdit" : "plan.dialog.allocationNew");

  const submit = () => {
    if (!label.trim()) return setErr(t("plan.dialog.errLabel"));
    if (parseAmount(amount) === null) return setErr(t("form.errAmount"));
    if ((link === "category" && !category) || (link === "goal" && !goalId)) return setErr(t("plan.dialog.errLink"));

    onSave({
      label,
      amount,
      category: link === "category" ? category : null,
      savingsGoalId: link === "goal" ? goalId : null,
    });
  };

  const changeLink = (next: Link) => {
    setErr("");
    setLink(next);
  };

  return (
    <DialogShell title={title} onClose={onCancel}>
      {err && <div className="alert alert--error">{err}</div>}

      <label className="form__label">{t(isIncome ? "plan.dialog.labelIncome" : "plan.dialog.labelAllocation")}</label>
      <input
        className="form__input"
        placeholder={t(isIncome ? "plan.dialog.placeholderIncome" : "plan.dialog.placeholderAllocation")}
        value={label}
        maxLength={60}
        autoFocus
        onChange={e => { setErr(""); setLabel(e.target.value); }}
      />

      <label className="form__label">{t("form.amountLabel")}</label>
      <AmountInput
        value={amount}
        placeholder={t("form.amountPlaceholder")}
        step={100}
        quickAmounts={[100, 500, 1000]}
        onChange={value => { setErr(""); setAmount(value); }}
      />

      {!isIncome && (
        <>
          <label className="form__label">{t("plan.dialog.linkLabel")}</label>
          <div className="segmented" role="group" aria-label={t("plan.dialog.linkLabel")}>
            {(["none", "category", "goal"] as const).map(option => (
              <button
                key={option}
                type="button"
                className={`segmented__btn${link === option ? " segmented__btn--active" : ""}`}
                onClick={() => changeLink(option)}
              >
                {t(`plan.dialog.link.${option}`)}
              </button>
            ))}
          </div>

          {link === "category" && (
            <div className="form__cat-grid">
              {categories.filter(c => !c.hidden || c.name === category).map(c => (
                <button
                  key={c.name}
                  type="button"
                  className={`form__cat-btn${category === c.name ? " form__cat-btn--active" : ""}`}
                  onClick={() => { setErr(""); setCategory(c.name); }}
                >
                  <span className="form__cat-btn__icon" style={{ color: c.color }}>{getCategoryIcon(c.icon)}</span>{categoryLabel(c.name)}
                </button>
              ))}
            </div>
          )}

          {link === "goal" && (goals.length === 0
            ? <div className="plan__hint">{t("plan.dialog.noGoals")}</div>
            : (
              <div className="form__cat-grid">
                {goals.map(g => (
                  <button
                    key={g.id}
                    type="button"
                    className={`form__cat-btn${goalId === g.id ? " form__cat-btn--active" : ""}`}
                    onClick={() => { setErr(""); setGoalId(g.id); }}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            ))}
        </>
      )}

      <div className="confirm__actions">
        <button className="confirm__btn confirm__btn--cancel" onClick={onCancel}>{t("common.cancel")}</button>
        <button className="confirm__btn confirm__btn--primary" onClick={submit} disabled={saving}>
          {saving ? t("form.submitLoading") : t("common.save")}
        </button>
      </div>

      {onDelete && (
        <button className="confirm__remove" onClick={onDelete}>{t("common.delete")}</button>
      )}
    </DialogShell>
  );
}
