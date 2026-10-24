import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getCategoryIcon } from "../categoryIcons";
import { Expense, ExpenseForm, UserCategory } from "../types";
import AmountInput from "./AmountInput";

interface EditExpenseDialogProps {
  expense: Expense;
  categories: UserCategory[];
  categoryLabel: (name: string) => string;
  saving: boolean;
  onSave: (form: ExpenseForm) => void;
  onCancel: () => void;
}

export default function EditExpenseDialog({ expense, categories, categoryLabel, saving, onSave, onCancel }: EditExpenseDialogProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<ExpenseForm>({
    desc: expense.description,
    cat: expense.cat,
    amount: String(expense.amount),
    date: expense.date,
  });
  const [err, setErr] = useState("");

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  const options = categories.filter(c => !c.hidden || c.name === expense.cat);

  const submit = () => {
    if (!form.desc.trim()) return setErr(t("form.errDescription"));
    const amount = parseFloat(form.amount);
    if (!form.amount || isNaN(amount) || amount <= 0) return setErr(t("form.errAmount"));
    setErr("");
    onSave({ ...form, desc: form.desc.trim() });
  };

  return (
    <div className="confirm__overlay" onClick={onCancel}>
      <div className="edit__box" role="dialog" aria-modal="true" aria-label={t("form.editTitle")} onClick={e => e.stopPropagation()}>
        <div className="edit__title">{t("form.editTitle")}</div>
        {err && <div className="alert alert--error">{err}</div>}

        <label className="form__label">{t("form.descriptionLabel")}</label>
        <input
          className="form__input"
          placeholder={t("form.descriptionPlaceholder")}
          value={form.desc}
          autoFocus
          onChange={e => { setErr(""); setForm(f => ({ ...f, desc: e.target.value })); }}
        />

        <label className="form__label">{t("form.amountLabel")}</label>
        <AmountInput
          value={form.amount}
          placeholder={t("form.amountPlaceholder")}
          onChange={amount => { setErr(""); setForm(f => ({ ...f, amount })); }}
        />

        <label className="form__label">{t("form.categoryLabel")}</label>
        <div className="form__cat-grid">
          {options.map(c => (
            <button
              key={c.name}
              type="button"
              className={`form__cat-btn${form.cat === c.name ? " form__cat-btn--active" : ""}`}
              onClick={() => setForm(f => ({ ...f, cat: c.name }))}
            >
              <span className="form__cat-btn__icon" style={{ color: c.color }}>{getCategoryIcon(c.icon)}</span>{categoryLabel(c.name)}
            </button>
          ))}
        </div>

        <label className="form__label">{t("form.dateLabel")}</label>
        <input className="form__input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />

        <div className="confirm__actions">
          <button className="confirm__btn confirm__btn--cancel" onClick={onCancel}>{t("common.cancel")}</button>
          <button className="confirm__btn confirm__btn--primary" onClick={submit} disabled={saving}>
            {saving ? t("form.submitLoading") : t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
