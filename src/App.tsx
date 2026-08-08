import { useState, useMemo, useRef, useLayoutEffect, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, ComposedChart, Area, Line, CartesianGrid } from "recharts";
import { useAuth } from "./hooks/useAuth";
import { useExpenses } from "./hooks/useExpenses";
import { useCountUp } from "./hooks/useCountUp";
import { useBudgetGoal } from "./hooks/useBudgetGoal";
import { useTheme } from "./hooks/useTheme";
import { useCategories } from "./hooks/useCategories";
import { fmt } from "./constants";
import { ExpenseForm } from "./types";
import { IconPieChart, IconSettings, IconInfo } from "./icons";
import { getCategoryIcon } from "./categoryIcons";
import Auth from "./Auth";
import Landing from "./Landing";
import PasswordReset from "./PasswordReset";
import Settings from "./Settings";
import CategoryManager from "./CategoryManager";
import "./styles/main.scss";

const TABS = ["dash", "add", "list"] as const;

const NOW = new Date();

function Skeleton() {
  return (
    <div className="skeleton__wrap">
      <div className="skeleton skeleton--hero" />
      <div className="skeleton skeleton--card" />
      <div className="skeleton skeleton--card" />
    </div>
  );
}

export default function App() {
  const { t } = useTranslation();
  const catLabel = (name: string) => t(`categories.${name}`, { defaultValue: name });
  const MONTHS = t("months", { returnObjects: true }) as string[];

  const { session, ready, isRecovery, logout } = useAuth();
  const { loading, saving, add, remove, filtered, byMonth } = useExpenses(session);
  const { goal, setGoal } = useBudgetGoal(session?.user.id);
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories(session?.user.id);
  const { theme, setTheme } = useTheme();
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
  useEffect(() => {
    if (!session) {
      setShowLogin(false);
      setShowSettings(false);
      setShowCategoryManager(false);
    }
  }, [session]);

  useLayoutEffect(() => {
    const el = tabRefs.current[TABS.indexOf(view)];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [view, ready, session]);

  useEffect(() => {
    setHiddenCats(new Set());
    setCatFilter(null);
  }, [month]);

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

  const getUserCat = (name: string) =>
    categories.find(c => c.name.toLowerCase() === name.toLowerCase())
    ?? categories.find(c => c.name === "Inne")
    ?? categories[0];

  const byCat = useMemo(() => {
    const m: Record<string, number> = {};
    monthExpenses.forEach(e => { m[e.cat] = (m[e.cat] || 0) + parseFloat(String(e.amount)); });
    return Object.entries(m)
      .map(([name, value]) => ({ value, ...getUserCat(name) }))
      .sort((a, b) => b.value - a.value);
  }, [monthExpenses, categories]);

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

  const confirmDelete = async () => {
    if (!confirmId) return;
    await remove(confirmId);
    setConfirmId(null);
  };

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

      {/* Confirm dialog */}
      {confirmId && (
        <div className="confirm__overlay">
          <div className="confirm__box">
            <div className="confirm__title">{t("confirmDelete.title")}</div>
            <div className="confirm__sub">{t("confirmDelete.body")}</div>
            <div className="confirm__actions">
              <button className="confirm__btn confirm__btn--cancel" onClick={() => setConfirmId(null)}>{t("common.cancel")}</button>
              <button className="confirm__btn confirm__btn--danger" onClick={confirmDelete}>{t("common.delete")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Budget goal dialog */}
      {budgetOpen && (
        <div className="confirm__overlay">
          <div className="confirm__box">
            <div className="confirm__title">{t("budgetGoal.title")}</div>
            <div className="confirm__sub">{t("budgetGoal.body")}</div>
            <input
              className="form__input"
              type="number"
              placeholder={t("budgetGoal.placeholder")}
              value={budgetInput}
              autoFocus
              onChange={e => setBudgetInput(e.target.value)}
            />
            <div className="confirm__actions">
              <button className="confirm__btn confirm__btn--cancel" onClick={() => setBudgetOpen(false)}>{t("common.cancel")}</button>
              <button className="confirm__btn confirm__btn--primary" onClick={saveBudget}>{t("common.save")}</button>
            </div>
            {goal !== null && (
              <button className="confirm__remove" onClick={() => { setGoal(null); setBudgetOpen(false); }}>
                {t("budgetGoal.removeGoal")}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Category filter hint dialog */}
      {catHintOpen && (
        <div className="confirm__overlay">
          <div className="confirm__box">
            <div className="confirm__title">{t("dashboard.catHintTitle")}</div>
            <div className="confirm__sub">
              {t("dashboard.catHintBody")}
            </div>
            <div className="confirm__actions confirm__actions--single">
              <button className="confirm__btn confirm__btn--primary" onClick={() => setCatHintOpen(false)}>{t("dashboard.catHintGotIt")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Category drill-down dialog */}
      {drilldownCat && (() => {
        const c = getUserCat(drilldownCat);
        const items = monthExpenses.filter(e => e.cat === drilldownCat);
        const catTotal = items.reduce((s, e) => s + parseFloat(String(e.amount)), 0);
        return (
          <div className="confirm__overlay" onClick={() => setDrilldownCat(null)}>
            <div className="drilldown__box" onClick={e => e.stopPropagation()}>
              <div className="drilldown__header">
                <div className="drilldown__icon" style={{ background: `${c.color}22`, color: c.color }}>{getCategoryIcon(c.icon)}</div>
                <div className="drilldown__heading">
                  <div className="drilldown__title">{catLabel(c.name)}</div>
                  <div className="drilldown__sub">{fmt(catTotal)} zł · {t("transactionsCount", { count: items.length })}</div>
                </div>
                <button type="button" className="drilldown__close" onClick={() => setDrilldownCat(null)} aria-label={t("drilldown.closeAria")}>×</button>
              </div>
              <div className="drilldown__list">
                {items.map(e => (
                  <div key={e.id} className="drilldown__row">
                    <div className="drilldown__desc">{e.description}</div>
                    <div className="drilldown__date">{e.date}</div>
                    <div className="drilldown__amount">{fmt(parseFloat(String(e.amount)))} zł</div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="btn--ghost drilldown__viewall"
                onClick={() => { setCatFilter(c.name); setDrilldownCat(null); setView("list"); }}
              >
                {t("drilldown.viewInHistory")}
              </button>
            </div>
          </div>
        );
      })()}

      {/* Header */}
      <div className="header">
        <div className="header__top">
          <div style={{ minWidth: 0, flex: 1, marginRight: 10 }}>
            <div className="header__logo">moneta</div>
            <div className="header__email">{session.user.email}</div>
          </div>
          <div className="header__controls">
            <select className="header__select" value={month} onChange={e => setMonth(+e.target.value)}>
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <button className="header__settings" onClick={() => setShowSettings(true)} aria-label={t("dashboard.settingsAria")}>
              {IconSettings}
            </button>
          </div>
        </div>
        <nav className="nav">
          {TABS.map((id, i) => (
            <button
              key={id}
              ref={el => { tabRefs.current[i] = el; }}
              className={`nav__tab${view === id ? " nav__tab--active" : ""}`}
              onClick={() => setView(id)}
            >
              {[t("dashboard.navOverview"), t("dashboard.navAdd"), t("dashboard.navHistory")][i]}
            </button>
          ))}
          <div className="nav__indicator" style={{ left: indicator.left, width: indicator.width }} />
        </nav>
      </div>

      <div className="app__container">

        {/* DASHBOARD */}
        {view === "dash" && (
          loading ? <Skeleton /> : <>
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
                <div className="card">
                  <div className="card__title">{t("dashboard.breakdownTitle")}</div>
                  {visibleCats.length === 0
                    ? <div className="cat-bar__all-hidden">{t("dashboard.allHidden")}</div>
                    : (
                      <ResponsiveContainer width="100%" height={190}>
                        <PieChart>
                          <Pie
                            data={visibleCats} dataKey="value" nameKey="name" cx="50%" cy="50%"
                            innerRadius={52} outerRadius={82} paddingAngle={3} cornerRadius={6} strokeWidth={0}
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

                <div className="card">
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
                  <div className="card">
                    <div className="card__title">{t("dashboard.dayByDayTitle")}</div>
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={byDay} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
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

            <div className="card">
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
                  <ResponsiveContainer width="100%" height={160}>
                    <ComposedChart data={byMonth} margin={{ top: 10, right: 10, left: -28, bottom: 0 }}>
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
          </>
        )}

        {/* ADD */}
        {view === "add" && <>
          <div className="form__title">{t("form.title")}</div>
          {err && <div className="alert alert--error">{err}</div>}

          <label className="form__label">{t("form.descriptionLabel")}</label>
          <input className="form__input" placeholder={t("form.descriptionPlaceholder")} value={form.desc}
            onChange={e => { setErr(""); setForm(f => ({ ...f, desc: e.target.value })); }} />

          <label className="form__label">{t("form.amountLabel")}</label>
          <input className="form__input" type="number" placeholder={t("form.amountPlaceholder")} value={form.amount}
            onChange={e => { setErr(""); setForm(f => ({ ...f, amount: e.target.value })); }} />

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
        </>}

        {/* LIST */}
        {view === "list" && <>
          <div className="history__title">{t("history.title")}</div>
          <div className="history__subtitle">{MONTHS[month]} {year} · {t("transactionsCount", { count: filteredExpenses.length })}</div>

          {byCat.length > 0 && (
            <div className="filter-pills">
              <button
                type="button"
                className={`filter-pill${catFilter === null ? " filter-pill--active" : ""}`}
                onClick={() => setCatFilter(null)}
              >
                {t("history.filterAll")}
              </button>
              {byCat.map(c => (
                <button
                  key={c.name}
                  type="button"
                  className={`filter-pill${catFilter === c.name ? " filter-pill--active" : ""}`}
                  onClick={() => setCatFilter(catFilter === c.name ? null : c.name)}
                >
                  <span className="filter-pill__icon" style={{ color: c.color }}>{getCategoryIcon(c.icon)}</span>{catLabel(c.name)}
                </button>
              ))}
            </div>
          )}

          {loading ? <Skeleton /> : filteredExpenses.length === 0
            ? (
              <div className="empty-state">
                <div className="empty-state__icon">{IconPieChart}</div>
                <div className="empty-state__title">{t("history.emptyTitle")}</div>
                <div className="empty-state__sub">
                  {catFilter ? t("history.emptySubFiltered") : t("history.emptySubAll")}
                </div>
                <button className="btn--primary empty-state__cta" onClick={() => setView("add")}>{t("dashboard.emptyCta")}</button>
              </div>
            )
            : <div className="card card--list">
              {filteredExpenses.map(e => {
                const c = getUserCat(e.cat);
                return (
                  <div key={e.id} className="list__row">
                    <div className="list__icon" style={{ background: `${c.color}22`, color: c.color }}>{getCategoryIcon(c.icon)}</div>
                    <div className="list__info">
                      <div className="list__desc">{e.description}</div>
                      <div className="list__meta">{catLabel(c.name)} · {e.date}</div>
                    </div>
                    <div className="list__amount">{fmt(parseFloat(String(e.amount)))} zł</div>
                    <button className="list__delete" onClick={() => handleDelete(e.id)}>×</button>
                  </div>
                );
              })}
            </div>
          }
        </>}

      </div>
    </div>
  );
}
