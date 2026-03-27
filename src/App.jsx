import { useState, useMemo, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { supabase } from "./supabase";
import Auth from "./auth";
import "./styles/main.scss";

const CATS = [
  { name: "Jedzenie",  icon: "🥑", color: "#f97316" },
  { name: "Transport", icon: "🚇", color: "#3b82f6" },
  { name: "Rozrywka",  icon: "🎬", color: "#a855f7" },
  { name: "Rachunki",  icon: "🏠", color: "#ef4444" },
  { name: "Zdrowie",   icon: "💊", color: "#10b981" },
  { name: "Ubrania",   icon: "👟", color: "#ec4899" },
  { name: "Edukacja",  icon: "📖", color: "#f59e0b" },
  { name: "Inne",      icon: "📦", color: "#6b7280" },
];
const MONTHS = ["Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec","Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień"];
const NOW = new Date();
const cat = n => CATS.find(c => c.name === n) || CATS[7];
const fmt = n => n.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function App() {
  const [session, setSession]     = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [expenses, setExpenses]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [view, setView]           = useState("dash");
  const [month, setMonth]         = useState(NOW.getMonth());
  const [year]                    = useState(NOW.getFullYear());
  const [form, setForm]           = useState({ desc: "", cat: "Jedzenie", amount: "", date: NOW.toISOString().split("T")[0] });
  const [err, setErr]             = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    fetchData();
  }, [session]);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("date", { ascending: false });
    if (!error) setExpenses(data || []);
    setLoading(false);
  };

  const filtered = useMemo(() => expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === month && d.getFullYear() === year;
  }), [expenses, month, year]);

  const total = filtered.reduce((s, e) => s + parseFloat(e.amount), 0);

  const byCat = useMemo(() => {
    const m = {};
    filtered.forEach(e => { m[e.cat] = (m[e.cat] || 0) + parseFloat(e.amount); });
    return Object.entries(m)
      .map(([name, value]) => ({ name, value, color: cat(name).color, icon: cat(name).icon }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  const byDay = useMemo(() => {
    const m = {};
    filtered.forEach(e => { const d = +e.date.split("-")[2]; m[d] = (m[d] || 0) + parseFloat(e.amount); });
    return Object.entries(m)
      .map(([day, amt]) => ({ day: String(+day), amt: +amt.toFixed(2) }))
      .sort((a, b) => +a.day - +b.day);
  }, [filtered]);

  const add = async () => {
    if (!form.desc.trim()) return setErr("Wpisz opis wydatku.");
    const a = parseFloat(form.amount);
    if (!form.amount || isNaN(a) || a <= 0) return setErr("Podaj poprawną kwotę.");
    setSaving(true); setErr("");
    const { data, error } = await supabase
      .from("expenses")
      .insert({ description: form.desc, cat: form.cat, amount: a, date: form.date, user_id: session.user.id })
      .select()
      .single();
    if (!error && data) {
      setExpenses(p => [{ ...data, desc: data.description }, ...p]);
      setForm(f => ({ ...f, desc: "", amount: "" }));
      setView("dash");
    } else setErr("Błąd zapisu.");
    setSaving(false);
  };

  const del = async (id) => {
    setExpenses(p => p.filter(e => e.id !== id));
    await supabase.from("expenses").delete().eq("id", id);
  };

  if (!authReady) return (
    <div className="app" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="app__loading">Ładowanie…</div>
    </div>
  );
  if (!session) return <Auth />;

  return (
    <div className="app">

      {/* Header */}
      <div className="header">
        <div className="header__top">
          <div style={{ minWidth: 0, flex: 1, marginRight: 10 }}>
            <div className="header__logo">moneta</div>
            <div className="header__email">{session.user.email}</div>
          </div>
          <div className="header__controls">
            <select
              className="header__select"
              value={month}
              onChange={e => setMonth(+e.target.value)}
            >
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <button className="header__logout" onClick={() => supabase.auth.signOut()}>
              Wyloguj
            </button>
          </div>
        </div>
        <nav className="nav">
          {["dash", "add", "list"].map((id, i) => (
            <button
              key={id}
              className={`nav__tab${view === id ? " nav__tab--active" : ""}`}
              onClick={() => setView(id)}
            >
              {["Przegląd", "Dodaj", "Historia"][i]}
            </button>
          ))}
        </nav>
      </div>

      <div className="app__container">
        {loading && <div className="app__loading">Ładowanie danych…</div>}

        {/* DASHBOARD */}
        {!loading && view === "dash" && <>
          <div className="hero">
            <div className="hero__month">{MONTHS[month]} {year}</div>
            <div className="hero__total">
              {fmt(total)}<span className="hero__currency">zł</span>
            </div>
            <div className="hero__count">{filtered.length} transakcji</div>
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
                    <Tooltip
                      formatter={v => `${fmt(v)} zł`}
                      contentStyle={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 13 }}
                    />
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
                        <div className="cat-bar__name">
                          <span className="cat-bar__icon">{c.icon}</span>
                          {c.name}
                        </div>
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
                      <Tooltip
                        formatter={v => `${fmt(v)} zł`}
                        contentStyle={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 13 }}
                      />
                      <Bar dataKey="amt" fill="#a78bfa" radius={[5, 5, 2, 2]} maxBarSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          }
        </>}

        {/* ADD */}
        {!loading && view === "add" && <>
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
              <button
                key={c.name}
                className={`form__cat-btn${form.cat === c.name ? " form__cat-btn--active" : ""}`}
                onClick={() => setForm(f => ({ ...f, cat: c.name }))}
              >
                <span className="form__cat-btn__icon">{c.icon}</span>
                {c.name}
              </button>
            ))}
          </div>

          <label className="form__label">Data</label>
          <input className="form__input" type="date" value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />

          <button className="btn--primary" onClick={add} disabled={saving}>
            {saving ? "Zapisywanie…" : "Dodaj wydatek"}
          </button>
        </>}

        {/* LIST */}
        {!loading && view === "list" && <>
          <div className="history__title">Historia</div>
          <div className="history__subtitle">{MONTHS[month]} {year} · {filtered.length} transakcji</div>

          {filtered.length === 0
            ? <div className="app__empty">Brak wydatków</div>
            : <div className="card card--list">
              {filtered.map(e => {
                const c = cat(e.cat);
                return (
                  <div key={e.id} className="list__row">
                    <div className="list__icon" style={{ background: `${c.color}22` }}>{c.icon}</div>
                    <div className="list__info">
                      <div className="list__desc">{e.description || "—"}</div>
                      <div className="list__meta">{c.name} · {e.date}</div>
                    </div>
                    <div className="list__amount">{fmt(parseFloat(e.amount))} zł</div>
                    <button className="list__delete" onClick={() => del(e.id)}>×</button>
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