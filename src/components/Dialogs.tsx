import { useTranslation } from "react-i18next";
import { fmt } from "../constants";
import { getCategoryIcon } from "../categoryIcons";
import { Expense, UserCategory } from "../types";
import AmountInput from "./AmountInput";

interface ConfirmDeleteDialogProps {
  title?: string;
  body?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDeleteDialog({ title, body, onCancel, onConfirm }: ConfirmDeleteDialogProps) {
  const { t } = useTranslation();
  return (
    <div className="confirm__overlay">
      <div className="confirm__box">
        <div className="confirm__title">{title ?? t("confirmDelete.title")}</div>
        <div className="confirm__sub">{body ?? t("confirmDelete.body")}</div>
        <div className="confirm__actions">
          <button className="confirm__btn confirm__btn--cancel" onClick={onCancel}>{t("common.cancel")}</button>
          <button className="confirm__btn confirm__btn--danger" onClick={onConfirm}>{t("common.delete")}</button>
        </div>
      </div>
    </div>
  );
}

interface BudgetDialogProps {
  value: string;
  hasGoal: boolean;
  onChange: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
  onRemove: () => void;
}

export function BudgetDialog({ value, hasGoal, onChange, onCancel, onSave, onRemove }: BudgetDialogProps) {
  const { t } = useTranslation();
  return (
    <div className="confirm__overlay">
      <div className="confirm__box">
        <div className="confirm__title">{t("budgetGoal.title")}</div>
        <div className="confirm__sub">{t("budgetGoal.body")}</div>
        <AmountInput
          value={value}
          placeholder={t("budgetGoal.placeholder")}
          step={100}
          quickAmounts={[100, 500, 1000]}
          autoFocus
          onChange={onChange}
        />
        <div className="confirm__actions">
          <button className="confirm__btn confirm__btn--cancel" onClick={onCancel}>{t("common.cancel")}</button>
          <button className="confirm__btn confirm__btn--primary" onClick={onSave}>{t("common.save")}</button>
        </div>
        {hasGoal && (
          <button className="confirm__remove" onClick={onRemove}>
            {t("budgetGoal.removeGoal")}
          </button>
        )}
      </div>
    </div>
  );
}

export function CategoryHintDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="confirm__overlay">
      <div className="confirm__box">
        <div className="confirm__title">{t("dashboard.catHintTitle")}</div>
        <div className="confirm__sub">{t("dashboard.catHintBody")}</div>
        <div className="confirm__actions confirm__actions--single">
          <button className="confirm__btn confirm__btn--primary" onClick={onClose}>{t("dashboard.catHintGotIt")}</button>
        </div>
      </div>
    </div>
  );
}

interface CategoryDrilldownDialogProps {
  category: UserCategory;
  label: string;
  expenses: Expense[];
  onClose: () => void;
  onViewAll: () => void;
}

export function CategoryDrilldownDialog({ category, label, expenses, onClose, onViewAll }: CategoryDrilldownDialogProps) {
  const { t } = useTranslation();
  const total = expenses.reduce((s, e) => s + parseFloat(String(e.amount)), 0);

  return (
    <div className="confirm__overlay" onClick={onClose}>
      <div className="drilldown__box" onClick={e => e.stopPropagation()}>
        <div className="drilldown__header">
          <div className="drilldown__icon" style={{ background: `${category.color}22`, color: category.color }}>{getCategoryIcon(category.icon)}</div>
          <div className="drilldown__heading">
            <div className="drilldown__title">{label}</div>
            <div className="drilldown__sub">{fmt(total)} zł · {t("transactionsCount", { count: expenses.length })}</div>
          </div>
          <button type="button" className="drilldown__close" onClick={onClose} aria-label={t("drilldown.closeAria")}>×</button>
        </div>
        <div className="drilldown__list">
          {expenses.map(e => (
            <div key={e.id} className="drilldown__row">
              <div className="drilldown__desc">{e.description}</div>
              <div className="drilldown__date">{e.date}</div>
              <div className="drilldown__amount">{fmt(parseFloat(String(e.amount)))} zł</div>
            </div>
          ))}
        </div>
        <button type="button" className="btn--ghost drilldown__viewall" onClick={onViewAll}>
          {t("drilldown.viewInHistory")}
        </button>
      </div>
    </div>
  );
}
