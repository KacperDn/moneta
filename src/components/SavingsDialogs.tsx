import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SavingsGoal, SavingsGoalForm } from "../types";
import { parseAmount } from "../utils/amount";
import { todayISO } from "../utils/date";
import { toCents } from "../utils/money";
import AmountInput from "./AmountInput";
import DialogShell from "./DialogShell";

interface SavingsGoalDialogProps {
  goal?: SavingsGoal;
  saving: boolean;
  onSave: (form: SavingsGoalForm) => void;
  onDelete?: () => void;
  onCancel: () => void;
}

export function SavingsGoalDialog({ goal, saving, onSave, onDelete, onCancel }: SavingsGoalDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(goal?.name ?? "");
  const [target, setTarget] = useState(goal?.target_amount ? String(goal.target_amount) : "");
  const [err, setErr] = useState("");

  const submit = () => {
    if (!name.trim()) return setErr(t("savings.dialog.errName"));
    if (target && parseAmount(target) === null) return setErr(t("form.errAmount"));
    onSave({ name, target });
  };

  return (
    <DialogShell title={t(goal ? "savings.dialog.goalEdit" : "savings.dialog.goalNew")} onClose={onCancel}>
      {err && <div className="alert alert--error">{err}</div>}

      <label className="form__label">{t("savings.dialog.nameLabel")}</label>
      <input
        className="form__input"
        placeholder={t("savings.dialog.namePlaceholder")}
        value={name}
        maxLength={60}
        autoFocus
        onChange={e => { setErr(""); setName(e.target.value); }}
      />

      <label className="form__label">{t("savings.dialog.targetLabel")}</label>
      <AmountInput
        value={target}
        placeholder={t("savings.dialog.targetPlaceholder")}
        step={500}
        quickAmounts={[500, 1000, 5000]}
        onChange={setTarget}
      />

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

interface SavingsEntryDialogProps {
  mode: "deposit" | "withdraw";
  goalName: string;
  balance: number;
  saving: boolean;
  onSave: (amount: number, date: string, note: string) => void;
  onCancel: () => void;
}

export function SavingsEntryDialog({ mode, goalName, balance, saving, onSave, onCancel }: SavingsEntryDialogProps) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");

  const submit = () => {
    const value = parseAmount(amount);
    if (value === null) return setErr(t("form.errAmount"));
    if (!date) return setErr(t("form.errDate"));
    if (mode === "withdraw" && toCents(value) > toCents(balance)) return setErr(t("savings.dialog.errWithdraw"));
    onSave(mode === "withdraw" ? -value : value, date, note);
  };

  return (
    <DialogShell title={`${t(mode === "deposit" ? "savings.dialog.deposit" : "savings.dialog.withdraw")} · ${goalName}`} onClose={onCancel}>
      {err && <div className="alert alert--error">{err}</div>}

      <label className="form__label">{t("form.amountLabel")}</label>
      <AmountInput
        value={amount}
        placeholder={t("form.amountPlaceholder")}
        step={100}
        quickAmounts={[100, 500, 1000]}
        autoFocus
        onChange={value => { setErr(""); setAmount(value); }}
      />

      <label className="form__label">{t("form.dateLabel")}</label>
      <input className="form__input" type="date" value={date} onChange={e => setDate(e.target.value)} />

      <label className="form__label">{t("savings.dialog.noteLabel")}</label>
      <input
        className="form__input"
        placeholder={t("savings.dialog.notePlaceholder")}
        value={note}
        maxLength={120}
        onChange={e => setNote(e.target.value)}
      />

      <div className="confirm__actions">
        <button className="confirm__btn confirm__btn--cancel" onClick={onCancel}>{t("common.cancel")}</button>
        <button className="confirm__btn confirm__btn--primary" onClick={submit} disabled={saving}>
          {saving ? t("form.submitLoading") : t("common.save")}
        </button>
      </div>
    </DialogShell>
  );
}
