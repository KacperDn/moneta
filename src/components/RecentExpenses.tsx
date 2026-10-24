import { useTranslation } from "react-i18next";
import { fmt } from "../constants";
import { getCategoryIcon } from "../categoryIcons";
import { Expense, UserCategory } from "../types";

interface RecentExpensesProps {
  expenses: Expense[];
  getCategory: (name: string) => UserCategory;
  categoryLabel: (name: string) => string;
}

export default function RecentExpenses({ expenses, getCategory, categoryLabel }: RecentExpensesProps) {
  const { t } = useTranslation();
  if (expenses.length === 0) return null;

  return (
    <aside className="add__recent">
      <div className="card__title">{t("form.recentTitle")}</div>
      <div className="card card--list">
        {expenses.map(e => {
          const c = getCategory(e.cat);
          return (
            <div key={e.id} className="list__row">
              <div className="list__icon" style={{ background: `${c.color}22`, color: c.color }}>{getCategoryIcon(c.icon)}</div>
              <div className="list__info">
                <div className="list__desc">{e.description}</div>
                <div className="list__meta">{categoryLabel(c.name)} · {e.date}</div>
              </div>
              <div className="list__amount">{fmt(parseFloat(String(e.amount)))} zł</div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
