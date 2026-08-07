import { useState, useMemo, useRef, useLayoutEffect, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, ComposedChart, Area, Line, CartesianGrid } from "recharts";
import { useAuth } from "./hooks/useAuth";
import { useExpenses } from "./hooks/useExpenses";
import { useCountUp } from "./hooks/useCountUp";
import { useBudgetGoal } from "./hooks/useBudgetGoal";
import { useTheme } from "./hooks/useTheme";
import { CATS, MONTHS, fmt, getCat } from "./constants";
import { ExpenseForm } from "./types";
import { IconPieChart, IconSettings, IconInfo } from "./icons";
import Auth from "./Auth";
import Landing from "./Landing";
import PasswordReset from "./PasswordReset";
import Settings from "./Settings";
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
  const { session, ready, isRecovery, logout } = useAuth();
  const { loading, saving, add, remove, filtered, byMonth } = useExpenses(session);
  const { goal, setGoal } = useBudgetGoal(session?.user.id);
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
  const [hiddenCats, setHiddenCats] = useState<Set<string>>(new Set());
  const [catHintOpen, setCatHintOpen] = useState(false);

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  // showLogin/showSettings are navigation state, not auth state — reset them
  // whenever the session drops so a fresh logout always lands on Landing,
  // and a later log-in never reopens a screen left over from before.
  useEffect(() => {
    if (!session) {
      setShowLogin(false);
      setShowSettings(false);
    }
  }, [session]);

  useLayoutEffect(() => {
    const el = tabRefs.current[TABS.indexOf(view)];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [view, ready, session]);

  useEffect(() => {
    setHiddenCats(new Set());
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

  const byCat = useMemo(() => {
    const m: Record<string, number> = {};
    monthExpenses.forEach(e => { m[e.cat] = (m[e.cat] || 0) + parseFloat(String(e.amount)); });
    return Object.entries(m)
      .map(([name, value]) => ({ value, ...getCat(name) }))
      .sort((a, b) => b.value - a.value);
  }, [monthExpenses]);

  const visibleCats = useMemo(() => byCat.filter(c => !hiddenCats.has(c.name)), [byCat, hiddenCats]);
  const visibleTotal = useMemo(() => visibleCats.reduce((s, c) => s + c.value, 0), [visibleCats]);

  const byDay = useMemo(() => {
    const m: Record<number, number> = {};
    monthExpenses.forEach(e => { const d = +e.date.split("-")[2]; m[d] = (m[d] || 0) + parseFloat(String(e.amount)); });
    return Object.entries(m)
      .map(([day, amt]) => ({ day: String(+day), amt: +amt.toFixed(2) }))
      .sort((a, b) => +a.day - +b.day);
  }, [monthExpenses]);

  const handleAdd = async () => {
    if (!form.desc.trim()) return setErr("Wpisz opis wydatku.");
    const a = parseFloat(form.amount);
    if (!form.amount || isNaN(a) || a <= 0) return setErr("Podaj poprawną kwotę.");
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
      <div className="app__loading">Ładowanie…</div>
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
        theme={theme}
        onThemeChange={setTheme}
        onBack={() => setShowSettings(false)}
        onLogout={logout}
      />
    );
  }

  return (
    <div className="app">

      {/* Confirm dialog */}
      {confirmId && (
        <div className="confirm__overlay">
          <div className="confirm__box">
            <div className="confirm__title">Usunąć wydatek?</div>
            <div className="confirm__sub">Tej operacji nie można cofnąć.</div>
            <div className="confirm__actions">
              <button className="confirm__btn confirm__btn--cancel" onClick={() => setConfirmId(null)}>Anuluj</button>
              <button className="confirm__btn confirm__btn--danger" onClick={confirmDelete}>Usuń</button>
            </div>
          </div>
        </div>
      )}

      {/* Budget goal dialog */}
      {budgetOpen && (
        <div className="confirm__overlay">
          <div className="confirm__box">
            <div className="confirm__title">Cel miesięczny</div>
            <div className="confirm__sub">Ustaw limit wydatków, żeby śledzić postęp w tym miesiącu.</div>
            <input
              className="form__input"
              type="number"
              placeholder="np. 2000"
              value={budgetInput}
              autoFocus
              onChange={e => setBudgetInput(e.target.value)}
            />
            <div className="confirm__actions">
              <button className="confirm__btn confirm__btn--cancel" onClick={() => setBudgetOpen(false)}>Anuluj</button>
              <button className="confirm__btn confirm__btn--primary" onClick={saveBudget}>Zapisz</button>
            </div>
            {goal !== null && (
              <button className="confirm__remove" onClick={() => { setGoal(null); setBudgetOpen(false); }}>
                Usuń cel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Category filter hint dialog */}
      {catHintOpen && (
        <div className="confirm__overlay">
          <div className="confirm__box">
            <div className="confirm__title">Filtrowanie kategorii</div>
            <div className="confirm__sub">
              Kliknij kategorię — na liście albo na wykresie — żeby tymczasowo wyłączyć ją z podziału. Procenty przeliczą się na nowo z tego, co zostało widoczne.
            </div>
            <div className="confirm__actions confirm__actions--single">
              <button className="confirm__btn confirm__btn--primary" onClick={() => setCatHintOpen(false)}>Rozumiem</button>
            </div>
          </div>
        </div>
      )}

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
            <button className="header__settings" onClick={() => setShowSettings(true)} aria-label="Ustawienia">
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
              {["Przegląd", "Dodaj", "Historia"][i]}
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
              <div className="hero__count">{monthExpenses.length} transakcji</div>

              {goal ? (
                <div className="budget">
                  <div className="budget__track">
                    <div className={`budget__fill budget__fill--${budgetStatus}`} style={{ width: `${Math.min(100, budgetPct)}%` }} />
                  </div>
                  <div className="budget__meta">
                    <span>{fmt(total)} / {fmt(goal)} zł</span>
                    <button className="budget__edit" onClick={openBudget}>Edytuj cel</button>
                  </div>
                </div>
              ) : (
                <button className="budget__set" onClick={openBudget}>+ Ustaw cel miesięczny</button>
              )}
            </div>

            {byCat.length === 0
              ? (
                <div className="empty-state">
                  <div className="empty-state__icon">{IconPieChart}</div>
                  <div className="empty-state__title">Brak wydatków w tym miesiącu</div>
                  <div className="empty-state__sub">Dodaj pierwszy wydatek, żeby zobaczyć podział na kategorie i wykresy.</div>
                  <button className="btn--primary empty-state__cta" onClick={() => setView("add")}>Dodaj wydatek</button>
                </div>
              )
              : <>
                <div className="card">
                  <div className="card__title">Podział</div>
                  {visibleCats.length === 0
                    ? <div className="cat-bar__all-hidden">Wszystkie kategorie odznaczone — kliknij jedną poniżej, żeby ją przywrócić.</div>
                    : (
                      <ResponsiveContainer width="100%" height={190}>
                        <PieChart>
                          <Pie
                            data={visibleCats} dataKey="value" nameKey="name" cx="50%" cy="50%"
                            innerRadius={52} outerRadius={82} paddingAngle={3} cornerRadius={6} strokeWidth={0}
                            animationDuration={700} animationEasing="ease-out"
                          >
                            {visibleCats.map((e, i) => (
                              <Cell key={i} fill={e.color} cursor="pointer" onClick={() => toggleCat(e.name)} />
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
                    Kategorie
                    <button type="button" className="card__info" onClick={() => setCatHintOpen(true)} aria-label="Jak to działa?">
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
                            <span className="cat-bar__icon">{c.icon}</span>
                            {c.name}
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
                    <div className="card__title">Dzień po dniu</div>
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
                          formatter={v => `${fmt(v as number)} zł`}
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
              <div className="card__title">Trendy miesięczne</div>
              {byMonth.length < 2 ? (
                <div className="trend__empty">
                  <div className="trend__empty-icon">📈</div>
                  <div className="trend__empty-text">Wykres pojawi się po uzupełnieniu wydatków z minimum 2 miesięcy</div>
                  <div className="trend__empty-sub">Masz dane z {byMonth.length} {byMonth.length === 1 ? "miesiąca" : "miesięcy"}</div>
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
                      <div className="trend__stat-label">vs poprzedni miesiąc</div>
                      <div className={`trend__stat-value ${up ? "trend__stat-value--up" : "trend__stat-value--down"}`}>
                        {up ? "↑" : "↓"} {Math.abs(parseFloat(pct))}%
                      </div>
                    </div>
                    <div className="trend__stat">
                      <div className="trend__stat-label">średnia miesięczna</div>
                      <div className="trend__stat-value">{fmt(avg)} zł</div>
                    </div>
                    <div className="trend__stat">
                      <div className="trend__stat-label">najdroższy</div>
                      <div className="trend__stat-value trend__stat-value--up">{maxM.label}</div>
                    </div>
                    <div className="trend__stat">
                      <div className="trend__stat-label">najtańszy</div>
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
                      <Tooltip formatter={v => `${fmt(v as number)} zł`} contentStyle={{ background: "var(--overlay-solid)", border: "1px solid var(--border-mid)", borderRadius: 10, fontSize: 13 }} />
                      <Area type="monotone" dataKey="total" stroke="none" fill="url(#trendFill)" animationDuration={700} />
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
          <div className="form__title">Nowy wydatek</div>
          {err && <div className="alert alert--error">{err}</div>}

          <label className="form__label">Opis</label>
          <input className="form__input" placeholder="np. Biedronka, Netflix…" value={form.desc}
            onChange={e => { setErr(""); setForm(f => ({ ...f, desc: e.target.value })); }} />

          <label className="form__label">Kwota (zł)</label>
          <input className="form__input" type="number" placeholder="0,00" value={form.amount}
            onChange={e => { setErr(""); setForm(f => ({ ...f, amount: e.target.value })); }} />

          <label className="form__label">Kategoria</label>
          <div className="form__cat-grid">
            {CATS.map(c => (
              <button key={c.name} className={`form__cat-btn${form.cat === c.name ? " form__cat-btn--active" : ""}`}
                onClick={() => setForm(f => ({ ...f, cat: c.name }))}>
                <span className="form__cat-btn__icon">{c.icon}</span>{c.name}
              </button>
            ))}
          </div>

          <label className="form__label">Data</label>
          <input className="form__input" type="date" value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />

          <button className="btn--primary" onClick={handleAdd} disabled={saving}>
            {saving && <span className="btn__spinner" />}
            {saving ? "Zapisywanie…" : "Dodaj wydatek"}
          </button>
        </>}

        {/* LIST */}
        {view === "list" && <>
          <div className="history__title">Historia</div>
          <div className="history__subtitle">{MONTHS[month]} {year} · {monthExpenses.length} transakcji</div>
          {loading ? <Skeleton /> : monthExpenses.length === 0
            ? (
              <div className="empty-state">
                <div className="empty-state__icon">{IconPieChart}</div>
                <div className="empty-state__title">Brak wydatków</div>
                <div className="empty-state__sub">Historia dla tego miesiąca jest pusta.</div>
                <button className="btn--primary empty-state__cta" onClick={() => setView("add")}>Dodaj wydatek</button>
              </div>
            )
            : <div className="card card--list">
              {monthExpenses.map(e => {
                const c = getCat(e.cat);
                return (
                  <div key={e.id} className="list__row">
                    <div className="list__icon" style={{ background: `${c.color}22` }}>{c.icon}</div>
                    <div className="list__info">
                      <div className="list__desc">{e.description}</div>
                      <div className="list__meta">{c.name} · {e.date}</div>
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