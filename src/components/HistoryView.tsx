import { useTranslation } from "react-i18next";
import { fmt } from "../constants";
import { IconPieChart, IconDownload } from "../icons";
import { getCategoryIcon } from "../categoryIcons";
import { Expense, UserCategory } from "../types";
import Skeleton from "./Skeleton";

interface HistoryViewProps {
  monthLabel: string;
  loading: boolean;
  expenses: Expense[];
  monthExpenseCount: number;
  monthCategories: Array<UserCategory & { value: number }>;
  monthTotal: number;
  catFilter: string | null;
  getCategory: (name: string) => UserCategory;
  categoryLabel: (name: string) => string;
  onCatFilterChange: (name: string | null) => void;
  onDelete: (id: string) => void;
  onAddExpense: () => void;
  onExport: () => void;
}

export default function HistoryView({
  monthLabel, loading, expenses, monthExpenseCount, monthCategories, monthTotal, catFilter,
  getCategory, categoryLabel, onCatFilterChange, onDelete, onAddExpense, onExport,
}: HistoryViewProps) {
  const { t } = useTranslation();

  return (
    <div className="history">
      <div className="history__main">
        <div className="history__title">{t("history.title")}</div>
        <div className="history__meta">
          <div className="history__subtitle">{monthLabel} · {t("transactionsCount", { count: expenses.length })}</div>
          {monthExpenseCount > 0 && (
            <button type="button" className="btn--ghost history__export" onClick={onExport}>
              {IconDownload}{t("history.exportMonth")}
            </button>
          )}
        </div>

        {monthCategories.length > 0 && (
          <div className="filter-pills">
            <button
              type="button"
              className={`filter-pill${catFilter === null ? " filter-pill--active" : ""}`}
              onClick={() => onCatFilterChange(null)}
            >
              {t("history.filterAll")}
            </button>
            {monthCategories.map(c => (
              <button
                key={c.name}
                type="button"
                className={`filter-pill${catFilter === c.name ? " filter-pill--active" : ""}`}
                onClick={() => onCatFilterChange(catFilter === c.name ? null : c.name)}
              >
                <span className="filter-pill__icon" style={{ color: c.color }}>{getCategoryIcon(c.icon)}</span>{categoryLabel(c.name)}
              </button>
            ))}
          </div>
        )}

        {loading ? <Skeleton /> : expenses.length === 0
          ? (
            <div className="empty-state">
              <div className="empty-state__icon">{IconPieChart}</div>
              <div className="empty-state__title">{t("history.emptyTitle")}</div>
              <div className="empty-state__sub">
                {catFilter ? t("history.emptySubFiltered") : t("history.emptySubAll")}
              </div>
              <button className="btn--primary empty-state__cta" onClick={onAddExpense}>{t("dashboard.emptyCta")}</button>
            </div>
          )
          : <div className="card card--list">
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
                  <button className="list__delete" onClick={() => onDelete(e.id)}>×</button>
                </div>
              );
            })}
          </div>
        }
      </div>

      {monthExpenseCount > 0 && (
        <aside className="history__summary">
          <div className="card__title">{monthLabel}</div>
          <div className="history__summary-total">{fmt(monthTotal)}<span>zł</span></div>
          <div className="history__summary-count">{t("transactionsCount", { count: monthExpenseCount })}</div>
          <div className="history__summary-rows">
            {monthCategories.map(c => (
              <div key={c.name} className="history__summary-row">
                <span className="history__summary-dot" style={{ background: c.color }} />
                <span className="history__summary-name">{categoryLabel(c.name)}</span>
                <span className="history__summary-amount">{fmt(c.value)} zł</span>
                <div className="history__summary-track">
                  <div style={{ width: `${monthTotal > 0 ? (c.value / monthTotal) * 100 : 0}%`, background: c.color }} />
                </div>
              </div>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}
