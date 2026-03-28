import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { useAuth } from "./hooks/useAuth";
import { useExpenses } from "./hooks/useExpenses";
import { CATS, MONTHS, fmt, getCat } from "./constants";
import { ExpenseForm } from "./types";
import Auth from "./Auth";
import "./styles/main.scss";

const NOW = new Date();

export default function App() {
  const { session, ready, logout } = useAuth();
  const { loading, saving, error: fetchError, add, remove, filtered, byMonth } = useExpenses(session);

  const [view, setView]   = useState("dash");
  const [month, setMonth] = useState(NOW.getMonth());
  const [year]            = useState(NOW.getFullYear());
  const [form, setForm]   = useState<ExpenseForm>({ desc: "", cat: "Jedzenie", amount: "", date: NOW.toISOString().split("T")[0] });
  const [err, setErr]     = useState("");

  const monthExpenses = filtered(month, year);
  const total = monthExpenses.reduce((s, e) => s + parseFloat(String(e.amount)), 0);

  const byCat = useMemo(() => {
    const m: Record<string, number> = {};
    monthExpenses.forEach(e => { m[e.cat] = (m[e.cat] || 0) + parseFloat(String(e.amount)); });
    return Object.entries(m)
      .map(([name, value]) => ({ value, ...getCat(name) }))
      .sort((a, b) => b.value - a.value);
  }, [monthExpenses]);

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

  if (!ready) return (
    <div className="app app--center">
      <div className="app__loading">Ładowanie…</div>
    </div>
  );
  if (!session) return <Auth />;

  return (
    <div className="app">
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
            <button className="header__logout" onClick={logout}>Wyloguj</button>
          </div>
        </div>
        <nav className="nav">
          {(["dash", "add", "list"] as const).map((id, i) => (
            <button key={id} className={`nav__tab${view === id ? " nav__tab--active" : ""}`} onClick={() => setView(id)}>
              {["Przegląd", "Dodaj", "Historia"][i]}
            </button>
          ))}
        </nav>
      </div>

      <div className="app__container">
        {(loading || fetchError) && (
          <div className={loading ? "app__loading" : "alert alert--error"}>
            {loading ? "Ładowanie danych…" : fetchError}
          </div>
        )}

        {!loading && view === "dash" && <>
          <div className="hero">
            <div className="hero__month">{MONTHS[month]} {year}</div>
            <div className="hero__total">{fmt(total)}<span className="hero__currency">zł</span></div>
            <div className="hero__count">{monthExpenses.length} transakcji</div>
          </div>

          {byCat.length === 0
            ? <div className="app__empty">Brak wydatków w tym miesiącu</div>
            : <>
              <div className="card">
                <div className="card__title">Podział</div>
                <ResponsiveContainer width="100%" height={190}>
                  <PieChart>
                    <Pie data={byCat} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={82} paddingAngle={3} strokeWidth={0}>
                      {byCat.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={v => `${fmt(v as number)} zł`} contentStyle={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 13 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <div className="card__title">Kategorie</div>
                {byCat.map(c => {
                  const pct = total > 0 ? (c.value / total * 100) : 0;
                  return (
                    <div key={c.name} className="cat-bar">
                      <div className="cat-bar__header">
                        <div className="cat-bar__name"><span className="cat-bar__icon">{c.icon}</span>{c.name}</div>
                        <div className="cat-bar__values">
                          <span className="cat-bar__pct">{pct.toFixed(0)}%</span>
                          <span className="cat-bar__amount">{fmt(c.value)} zł</span>
                        </div>
                      </div>
                      <div className="cat-bar__track">
                        <div className="cat-bar__fill" style={{ width: `${pct}%`, background: c.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {byDay.length > 1 && (
                <div className="card">
                  <div className="card__title">Dzień po dniu</div>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={byDay} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={v => `${fmt(v as number)} zł`} contentStyle={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 13 }} />
                      <Bar dataKey="amt" fill="#a78bfa" radius={[5, 5, 2, 2]} maxBarSize={32} />
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
                  <LineChart data={byMonth} margin={{ top: 10, right: 10, left: -28, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={v => `${fmt(v as number)} zł`} contentStyle={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 13 }} />
                    <Line type="monotone" dataKey="total" stroke="#a78bfa" strokeWidth={2} dot={{ fill: "#a78bfa", r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </>;
            })()}
          </div>
        </>}

        {!loading && view === "add" && <>
          <div className="form__title">Nowy wydatek</div>
          {(err || fetchError) && <div className="alert alert--error">{err || fetchError}</div>}

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
            {saving ? "Zapisywanie…" : "Dodaj wydatek"}
          </button>
        </>}

        {!loading && view === "list" && <>
          <div className="history__title">Historia</div>
          <div className="history__subtitle">{MONTHS[month]} {year} · {monthExpenses.length} transakcji</div>
          {monthExpenses.length === 0
            ? <div className="app__empty">Brak wydatków</div>
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
                    <button className="list__delete" onClick={() => remove(e.id)}>×</button>
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