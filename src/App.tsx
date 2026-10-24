import { useState, useMemo, useRef, useLayoutEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, ComposedChart, Area, Line, CartesianGrid } from "recharts";
import { useAuth } from "./hooks/useAuth";
import { useExpenses } from "./hooks/useExpenses";
import { useCountUp } from "./hooks/useCountUp";
import { useBudgetGoal } from "./hooks/useBudgetGoal";
import { useTheme } from "./hooks/useTheme";
import { useCategories } from "./hooks/useCategories";
import { useScrollReveal, revealProps } from "./hooks/useScrollReveal";
import { useMediaQuery } from "./hooks/useMediaQuery";
import { fmt } from "./constants";
import { sumByCategory } from "./utils/expenseStats";
import { expensesToCsv } from "./utils/exportCsv";
import { downloadCsvFile } from "./utils/downloadFile";
import { ExpenseForm } from "./types";
import { IconPieChart, IconSettings, IconInfo, IconOverview, IconAdd, IconHistory } from "./icons";
import { getCategoryIcon } from "./categoryIcons";
import Auth from "./Auth";
import Landing from "./Landing";
import PasswordReset from "./PasswordReset";
import Settings from "./Settings";
import CategoryManager from "./CategoryManager";
import Skeleton from "./components/Skeleton";
import HistoryView from "./components/HistoryView";
import RecentExpenses from "./components/RecentExpenses";
import MonthSelect from "./components/MonthSelect";
import AmountInput from "./components/AmountInput";
import { ConfirmDeleteDialog, BudgetDialog, CategoryHintDialog, CategoryDrilldownDialog } from "./components/Dialogs";
import "./styles/main.scss";

const TABS = ["dash", "add", "list"] as const;
const TAB_ICONS = [IconOverview, IconAdd, IconHistory];

const NOW = new Date();

export default function App() {
  const { t } = useTranslation();
  const catLabel = (name: string) => t(`categories.${name}`, { defaultValue: name });
  const MONTHS = t("months", { returnObjects: true }) as string[];

  const { session, ready, isRecovery, logout } = useAuth();
  const { expenses, loading, saving, add, remove, filtered, byMonth } = useExpenses(session);
  const { goal, setGoal } = useBudgetGoal(session?.user.id);
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories(session?.user.id);
  const { theme, setTheme } = useTheme();
  useScrollReveal();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const chartHeights = isDesktop
    ? { pie: 270, pieInner: 70, pieOuter: 108, bars: 320, trend: 220, axisLeft: 0 }
    : { pie: 190, pieInner: 52, pieOuter: 82, bars: 140, trend: 160, axisLeft: -28 };
  const [showLogin, setShowLogin] = useState(false);

  const [view, setView]         = useState<typeof TABS[number]>("dash");
  const [month, setMonth]       = useState(NOW.getMonth());
  const [year]                  = useState(NOW.getFullYear());
  const [form, setForm]         = useState<ExpenseForm>({ desc: "", cat: "Jedzenie", amount: "", date: NOW.toISOString().split("T")[0] });
  const [err, setErr]           = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [hiddenCats, setHiddenCats] = useState<Set<string>>(new Set());
  const [catHintOpen, setCatHintOpen] = useState(false);
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [drilldownCat, setDrilldownCat] = useState<string | null>(null);

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  // showLogin/showSettings are navigation state, not auth state — reset them
  // whenever the session drops so a fresh logout always lands on Landing,
  // and a later log-in never reopens a screen left over from before.
  // Adjusted during render (not in an effect) to avoid an extra render pass.
  const [prevSession, setPrevSession] = useState(session);
  if (session !== prevSession) {
    setPrevSession(session);
    if (!session) {
      setShowLogin(false);
      setShowSettings(false);
      setShowCategoryManager(false);
    }
  }

  useLayoutEffect(() => {
    const el = tabRefs.current[TABS.indexOf(view)];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [view, ready, session]);

  const [prevMonth, setPrevMonth] = useState(month);
  if (month !== prevMonth) {
    setPrevMonth(month);
    setHiddenCats(new Set());
    setCatFilter(null);
  }

  const toggleCat = (name: string) => {
    setHiddenCats(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const monthExpenses = filtered(month, year);
  const total = monthExpenses.reduce((s, e) => s + parseFloat(String(e.amount)), 0);
  const animatedTotal = useCountUp(total);

  const budgetPct = goal ? (total / goal) * 100 : 0;
  const budgetStatus = budgetPct >= 100 ? "over" : budgetPct >= 80 ? "warn" : "ok";

  const openBudget = () => {
    setBudgetInput(goal ? String(goal) : "");
    setBudgetOpen(true);
  };

  const saveBudget = () => {
    const v = parseFloat(budgetInput);
    if (!budgetInput || isNaN(v) || v <= 0) return;
    setGoal(v);
    setBudgetOpen(false);
  };

  const getUserCat = useCallback((name: string) =>
    categories.find(c => c.name.toLowerCase() === name.toLowerCase())
    ?? categories.find(c => c.name === "Inne")
    ?? categories[0], [categories]);

  const byCat = useMemo(() => {
    const totals = sumByCategory(monthExpenses);
    return Object.entries(totals)
      .map(([name, value]) => ({ value, ...getUserCat(name) }))
      .sort((a, b) => b.value - a.value);
  }, [monthExpenses, getUserCat]);

  const visibleCats = useMemo(() => byCat.filter(c => !hiddenCats.has(c.name)), [byCat, hiddenCats]);
  const visibleTotal = useMemo(() => visibleCats.reduce((s, c) => s + c.value, 0), [visibleCats]);

  const filteredExpenses = useMemo(
    () => catFilter ? monthExpenses.filter(e => e.cat === catFilter) : monthExpenses,
    [monthExpenses, catFilter]
  );

  const byDay = useMemo(() => {
    const m: Record<number, number> = {};
    monthExpenses.forEach(e => { const d = +e.date.split("-")[2]; m[d] = (m[d] || 0) + parseFloat(String(e.amount)); });
    return Object.entries(m)
      .map(([day, amt]) => ({ day: String(+day), amt: +amt.toFixed(2) }))
      .sort((a, b) => +a.day - +b.day);
  }, [monthExpenses]);

  const handleAdd = async () => {
    if (!form.desc.trim()) return setErr(t("form.errDescription"));
    const a = parseFloat(form.amount);
    if (!form.amount || isNaN(a) || a <= 0) return setErr(t("form.errAmount"));
    const ok = await add(form, session!.user.id);
    if (ok) {
      setForm(f => ({ ...f, desc: "", amount: "" }));
      setView("dash");
    }
    setErr("");
  };

  const handleDelete = (id: string) => setConfirmId(id);

  const exportMonthCsv = () => {
    downloadCsvFile(`moneta-${MONTHS[month].toLowerCase()}-${year}.csv`, expensesToCsv(monthExpenses));
  };

  const confirmDelete = async () => {
    if (!confirmId) return;
    await remove(confirmId);
    setConfirmId(null);
  };

  const tabLabels = [t("dashboard.navOverview"), t("dashboard.navAdd"), t("dashboard.navHistory")];
  const drilldownCategory = drilldownCat ? getUserCat(drilldownCat) : null;

  if (!ready) return (
    <div className="app app--center">
      <div className="app__loading">{t("common.loading")}</div>
    </div>
  );
  if (isRecovery) return <PasswordReset />;
  if (!session) {
    return showLogin
      ? <Auth onBack={() => setShowLogin(false)} />
      : <Landing theme={theme} onThemeChange={setTheme} onGetStarted={() => setShowLogin(true)} />;
  }
  if (showSettings) {
    return (
      <Settings
        email={session.user.email!}
        expenses={expenses}
        categories={categories}
        addCategory={addCategory}
        updateCategory={updateCategory}
        deleteCategory={deleteCategory}
        theme={theme}
        onThemeChange={setTheme}
        onBack={() => setShowSettings(false)}
        onLogout={logout}
      />
    );
  }
  if (showCategoryManager) {
    return (
      <CategoryManager
        categories={categories}
        addCategory={addCategory}
        updateCategory={updateCategory}
        deleteCategory={deleteCategory}
        onBack={() => setShowCategoryManager(false)}
      />
    );
  }

  return (
    <div className="app">

      {confirmId && (
        <ConfirmDeleteDialog onCancel={() => setConfirmId(null)} onConfirm={confirmDelete} />
      )}

      {budgetOpen && (
        <BudgetDialog
          value={budgetInput}
          hasGoal={goal !== null}
          onChange={setBudgetInput}
          onCancel={() => setBudgetOpen(false)}
          onSave={saveBudget}
          onRemove={() => { setGoal(null); setBudgetOpen(false); }}
        />
      )}

      {catHintOpen && <CategoryHintDialog onClose={() => setCatHintOpen(false)} />}

      {drilldownCategory && (
        <CategoryDrilldownDialog
          category={drilldownCategory}
          label={catLabel(drilldownCategory.name)}
          expenses={monthExpenses.filter(e => e.cat === drilldownCategory.name)}
          onClose={() => setDrilldownCat(null)}
          onViewAll={() => { setCatFilter(drilldownCategory.name); setDrilldownCat(null); setView("list"); }}
        />
      )}

      {/* Header */}
      <div className="header">
        <div className="header__top">
          <div className="header__brand">
            <div className="header__logo">moneta</div>
            <div className="header__email">{session.user.email}</div>
          </div>
          <div className="header__controls">
            <MonthSelect months={MONTHS} value={month} onChange={setMonth} label={t("dashboard.monthSelectAria")} />
            <button className="header__settings" onClick={() => setShowSettings(true)} aria-label={t("dashboard.settingsAria")}>
              {IconSettings}
            </button>
          </div>
        </div>
        <nav className="nav nav--header">
          {TABS.map((id, i) => (
            <button
              key={id}
              ref={el => { tabRefs.current[i] = el; }}
              className={`nav__tab${view === id ? " nav__tab--active" : ""}`}
              onClick={() => setView(id)}
            >
              {tabLabels[i]}
            </button>
          ))}
          <div className="nav__indicator" style={{ left: indicator.left, width: indicator.width }} />
        </nav>
      </div>

      <div className={`app__container app__container--${view}`}>

        {/* DASHBOARD */}
        {view === "dash" && (
          loading ? <Skeleton /> : <div className="dash">
            <div className="hero">
              <div className="hero__month">{MONTHS[month]} {year}</div>
              <div className="hero__total">{fmt(animatedTotal)}<span className="hero__currency">zł</span></div>
              <div className="hero__count">{t("transactionsCount", { count: monthExpenses.length })}</div>

              {goal ? (
                <div className="budget">
                  <div className="budget__track">
                    <div className={`budget__fill budget__fill--${budgetStatus}`} style={{ width: `${Math.min(100, budgetPct)}%` }} />
                  </div>
                  <div className="budget__meta">
                    <span>{fmt(total)} / {fmt(goal)} zł</span>
                    <button className="budget__edit" onClick={openBudget}>{t("dashboard.editGoal")}</button>
                  </div>
                </div>
              ) : (
                <button className="budget__set" onClick={openBudget}>{t("dashboard.setGoal")}</button>
              )}
            </div>

            {byCat.length === 0
              ? (
                <div className="empty-state">
                  <div className="empty-state__icon">{IconPieChart}</div>
                  <div className="empty-state__title">{t("dashboard.emptyTitle")}</div>
                  <div className="empty-state__sub">{t("dashboard.emptySubtitle")}</div>
                  <button className="btn--primary empty-state__cta" onClick={() => setView("add")}>{t("dashboard.emptyCta")}</button>
                </div>
              )
              : <>
                <div className="card" {...revealProps(1)}>
                  <div className="card__title">{t("dashboard.breakdownTitle")}</div>
                  {visibleCats.length === 0
                    ? <div className="cat-bar__all-hidden">{t("dashboard.allHidden")}</div>
                    : (
                      <ResponsiveContainer width="100%" height={chartHeights.pie}>
                        <PieChart>
                          <Pie
                            data={visibleCats} dataKey="value" nameKey="name" cx="50%" cy="50%"
                            innerRadius={chartHeights.pieInner} outerRadius={chartHeights.pieOuter} paddingAngle={3} cornerRadius={6} strokeWidth={0}
                            animationDuration={700} animationEasing="ease-out"
                          >
                            {visibleCats.map((e, i) => (
                              <Cell key={i} fill={e.color} cursor="pointer" onClick={() => setDrilldownCat(e.name)} />
                            ))}
                          </Pie>
                          <Tooltip formatter={v => `${fmt(v as number)} zł`} contentStyle={{ background: "var(--overlay-solid)", border: "1px solid var(--border-mid)", borderRadius: 10, fontSize: 13 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )
                  }
                </div>

                <div className="card" {...revealProps(2)}>
                  <div className="card__title card__title--row">
                    {t("dashboard.categoriesTitle")}
                    <button type="button" className="card__info" onClick={() => setCatHintOpen(true)} aria-label={t("dashboard.categoriesInfoAria")}>
                      {IconInfo}
                    </button>
                  </div>
                  {byCat.map(c => {
                    const hidden = hiddenCats.has(c.name);
                    const pct = !hidden && visibleTotal > 0 ? (c.value / visibleTotal * 100) : 0;
                    return (
                      <button
                        key={c.name}
                        type="button"
                        className={`cat-bar${hidden ? " cat-bar--hidden" : ""}`}
                        onClick={() => toggleCat(c.name)}
                      >
                        <div className="cat-bar__header">
                          <div className="cat-bar__name">
                            <span className="cat-bar__dot" style={{ background: hidden ? "transparent" : c.color, borderColor: c.color }} />
                            <span className="cat-bar__icon" style={{ color: c.color }}>{getCategoryIcon(c.icon)}</span>
                            {catLabel(c.name)}
                          </div>
                          <div className="cat-bar__values">
                            <span className="cat-bar__pct">{hidden ? "—" : `${pct.toFixed(0)}%`}</span>
                            <span className="cat-bar__amount">{fmt(c.value)} zł</span>
                          </div>
                        </div>
                        <div className="cat-bar__track">
                          <div className="cat-bar__fill" style={{ width: `${pct}%`, background: c.color }} />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {byDay.length > 1 && (
                  <div className="card" {...revealProps(3)}>
                    <div className="card__title">{t("dashboard.dayByDayTitle")}</div>
                    <ResponsiveContainer width="100%" height={chartHeights.bars}>
                      <BarChart data={byDay} margin={{ top: 0, right: 0, left: chartHeights.axisLeft, bottom: 0 }}>
                        <defs>
                          <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--accent-soft)" />
                            <stop offset="100%" stopColor="var(--accent)" />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                        <Tooltip
                          formatter={v => [`${fmt(v as number)} zł`, t("dashboard.tooltipExpenses")]}
                          cursor={{ fill: "var(--surface)" }}
                          contentStyle={{ background: "var(--overlay-solid)", border: "1px solid var(--border-mid)", borderRadius: 10, fontSize: 13 }}
                        />
                        <Bar dataKey="amt" fill="url(#barFill)" radius={[5, 5, 2, 2]} maxBarSize={32} animationDuration={600} animationEasing="ease-out" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            }

            <div className="card" {...revealProps(4)}>
              <div className="card__title">{t("dashboard.monthlyTrendTitle")}</div>
              {byMonth.length < 2 ? (
                <div className="trend__empty">
                  <div className="trend__empty-icon">📈</div>
                  <div className="trend__empty-text">{t("dashboard.trendEmptyTitle")}</div>
                  <div className="trend__empty-sub">{t("monthsDataCount", { count: byMonth.length })}</div>
                </div>
              ) : (() => {
                const last = byMonth[byMonth.length - 1];
                const prev = byMonth[byMonth.length - 2];
                const diff = last.total - prev.total;
                const pct = ((diff / prev.total) * 100).toFixed(1);
                const up = diff > 0;
                const avg = byMonth.reduce((s, m) => s + m.total, 0) / byMonth.length;
                const maxM = byMonth.reduce((a, b) => a.total > b.total ? a : b);
                const minM = byMonth.reduce((a, b) => a.total < b.total ? a : b);
                return <>
                  <div className="trend__stats">
                    <div className="trend__stat">
                      <div className="trend__stat-label">{t("dashboard.vsLastMonth")}</div>
                      <div className={`trend__stat-value ${up ? "trend__stat-value--up" : "trend__stat-value--down"}`}>
                        {up ? "↑" : "↓"} {Math.abs(parseFloat(pct))}%
                      </div>
                    </div>
                    <div className="trend__stat">
                      <div className="trend__stat-label">{t("dashboard.avgMonthly")}</div>
                      <div className="trend__stat-value">{fmt(avg)} zł</div>
                    </div>
                    <div className="trend__stat">
                      <div className="trend__stat-label">{t("dashboard.mostExpensive")}</div>
                      <div className="trend__stat-value trend__stat-value--up">{maxM.label}</div>
                    </div>
                    <div className="trend__stat">
                      <div className="trend__stat-label">{t("dashboard.cheapest")}</div>
                      <div className="trend__stat-value trend__stat-value--down">{minM.label}</div>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={chartHeights.trend}>
                    <ComposedChart data={byMonth} margin={{ top: 10, right: 10, left: chartHeights.axisLeft, bottom: 0 }}>
                      <defs>
                        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={v => [`${fmt(v as number)} zł`, t("dashboard.tooltipSum")]} contentStyle={{ background: "var(--overlay-solid)", border: "1px solid var(--border-mid)", borderRadius: 10, fontSize: 13 }} />
                      <Area type="monotone" dataKey="total" stroke="none" fill="url(#trendFill)" animationDuration={700} legendType="none" tooltipType="none" />
                      <Line type="monotone" dataKey="total" stroke="var(--accent)" strokeWidth={2.5} dot={{ fill: "var(--accent)", r: 4 }} activeDot={{ r: 6 }} animationDuration={700} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </>;
              })()}
            </div>
          </div>
        )}

        {/* ADD */}
        {view === "add" && <div className="add">
          <section className="add__form">
            <div className="form__title">{t("form.title")}</div>
            {err && <div className="alert alert--error">{err}</div>}

            <label className="form__label">{t("form.descriptionLabel")}</label>
            <input className="form__input" placeholder={t("form.descriptionPlaceholder")} value={form.desc}
              onChange={e => { setErr(""); setForm(f => ({ ...f, desc: e.target.value })); }} />

            <label className="form__label">{t("form.amountLabel")}</label>
            <AmountInput
              value={form.amount}
              placeholder={t("form.amountPlaceholder")}
              quickAmounts={[10, 50, 100]}
              onChange={amount => { setErr(""); setForm(f => ({ ...f, amount })); }}
            />

            <label className="form__label form__label--row">
              {t("form.categoryLabel")}
              <button type="button" className="form__manage-cats" onClick={() => setShowCategoryManager(true)}>
                {t("form.manageCategories")}
              </button>
            </label>
            <div className="form__cat-grid">
              {categories.filter(c => !c.hidden).map(c => (
                <button key={c.name} className={`form__cat-btn${form.cat === c.name ? " form__cat-btn--active" : ""}`}
                  onClick={() => setForm(f => ({ ...f, cat: c.name }))}>
                  <span className="form__cat-btn__icon" style={{ color: c.color }}>{getCategoryIcon(c.icon)}</span>{catLabel(c.name)}
                </button>
              ))}
            </div>

            <label className="form__label">{t("form.dateLabel")}</label>
            <input className="form__input" type="date" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />

            <button className="btn--primary" onClick={handleAdd} disabled={saving}>
              {saving && <span className="btn__spinner" />}
              {saving ? t("form.submitLoading") : t("form.submitIdle")}
            </button>
          </section>
          <RecentExpenses expenses={expenses.slice(0, 6)} getCategory={getUserCat} categoryLabel={catLabel} />
        </div>}

        {/* LIST */}
        {view === "list" && (
          <HistoryView
            monthLabel={`${MONTHS[month]} ${year}`}
            loading={loading}
            expenses={filteredExpenses}
            monthExpenseCount={monthExpenses.length}
            monthCategories={byCat}
            monthTotal={total}
            catFilter={catFilter}
            getCategory={getUserCat}
            categoryLabel={catLabel}
            onCatFilterChange={setCatFilter}
            onDelete={handleDelete}
            onAddExpense={() => setView("add")}
            onExport={exportMonthCsv}
          />
        )}

      </div>

      <nav className="nav nav--bottom" aria-label={t("dashboard.navAria")}>
        {TABS.map((id, i) => (
          <button
            key={id}
            className={`nav__bottom-tab${view === id ? " nav__bottom-tab--active" : ""}`}
            onClick={() => setView(id)}
            aria-current={view === id ? "page" : undefined}
          >
            <span className="nav__bottom-icon">{TAB_ICONS[i]}</span>
            <span>{tabLabels[i]}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
