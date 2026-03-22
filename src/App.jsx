import { useState, useMemo, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";

const SUPABASE_URL = "https://qimjchrhredybfzrfhdb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpbWpjaHJocmVkeWJmenJmaGRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMDkxMzMsImV4cCI6MjA4OTc4NTEzM30.N7KUfP5s7Hc7GyTMdETI7_9jmMC7VCmKuTcvRNPRDGE";
const API = `${SUPABASE_URL}/rest/v1/expenses`;
const HEADERS = { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` };

const CATS = [
  { name: "Jedzenie",   icon: "🥑", color: "#f97316" },
  { name: "Transport",  icon: "🚇", color: "#3b82f6" },
  { name: "Rozrywka",   icon: "🎬", color: "#a855f7" },
  { name: "Rachunki",   icon: "🏠", color: "#ef4444" },
  { name: "Zdrowie",    icon: "💊", color: "#10b981" },
  { name: "Ubrania",    icon: "👟", color: "#ec4899" },
  { name: "Edukacja",   icon: "📖", color: "#f59e0b" },
  { name: "Inne",       icon: "📦", color: "#6b7280" },
];
const MONTHS = ["Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec","Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień"];
const NOW = new Date();
const cat = n => CATS.find(c => c.name === n) || CATS[7];
const fmt = n => n.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState("dash");
  const [month, setMonth] = useState(NOW.getMonth());
  const [year] = useState(NOW.getFullYear());
  const [form, setForm] = useState({ desc: "", cat: "Jedzenie", amount: "", date: NOW.toISOString().split("T")[0] });
  const [err, setErr] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}?select=*&order=date.desc`, { headers: HEADERS });
      const data = await res.json();
      setExpenses(Array.isArray(data) ? data : []);
    } catch { setErr("Błąd połączenia z bazą."); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === month && d.getFullYear() === year;
  }), [expenses, month, year]);

  const total = filtered.reduce((s, e) => s + parseFloat(e.amount), 0);

  const byCat = useMemo(() => {
    const m = {};
    filtered.forEach(e => { m[e.cat] = (m[e.cat] || 0) + parseFloat(e.amount); });
    return Object.entries(m).map(([name, value]) => ({ name, value, color: cat(name).color, icon: cat(name).icon })).sort((a,b) => b.value - a.value);
  }, [filtered]);

  const byDay = useMemo(() => {
    const m = {};
    filtered.forEach(e => { const d = +e.date.split("-")[2]; m[d] = (m[d]||0) + parseFloat(e.amount); });
    return Object.entries(m).map(([day, amt]) => ({ day: String(+day), amt: +amt.toFixed(2) })).sort((a,b)=>+a.day-+b.day);
  }, [filtered]);

  const add = async () => {
    if (!form.desc.trim()) return setErr("Wpisz opis wydatku.");
    const a = parseFloat(form.amount);
    if (!form.amount || isNaN(a) || a <= 0) return setErr("Podaj poprawną kwotę.");
    setSaving(true); setErr("");
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { ...HEADERS, "Prefer": "return=representation" },
        body: JSON.stringify({ description: form.desc, cat: form.cat, amount: a, date: form.date })
      });
      const data = await res.json();
      if (Array.isArray(data) && data[0]) {
        setExpenses(p => [{ ...data[0], desc: data[0].description }, ...p]);
        setForm(f => ({ ...f, desc: "", amount: "" }));
        setView("dash");
      } else setErr("Błąd zapisu.");
    } catch { setErr("Błąd połączenia."); }
    setSaving(false);
  };

  const del = async (id) => {
    setExpenses(p => p.filter(e => e.id !== id));
    await fetch(`${API}?id=eq.${id}`, { method: "DELETE", headers: HEADERS });
  };

  const NavBtn = ({ id, label }) => (
    <button onClick={() => setView(id)} style={{
      flex:1, padding:"13px 0", background:"none", border:"none",
      color: view===id ? "#fff" : "rgba(255,255,255,0.45)",
      fontWeight: view===id ? 600 : 400, fontSize:13, cursor:"pointer",
      borderBottom: view===id ? "2px solid #fff" : "2px solid transparent",
      letterSpacing:"0.02em", transition:"color .15s"
    }}>{label}</button>
  );

  return (
    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'Inter',sans-serif", background:"#09090b", minHeight:"100vh", color:"#fafafa" }}>
      <div style={{ background:"#09090b", borderBottom:"1px solid rgba(255,255,255,0.07)", padding:"18px 20px 0" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <div>
            <div style={{ fontSize:19, fontWeight:700, letterSpacing:"-0.5px" }}>
              <span style={{ color:"#a78bfa" }}>moneta</span>
            </div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginTop:1 }}>personal finance</div>
          </div>
          <select value={month} onChange={e => setMonth(+e.target.value)} style={{
            background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
            color:"#fafafa", borderRadius:8, padding:"6px 10px", fontSize:13, cursor:"pointer"
          }}>
            {MONTHS.map((m,i) => <option key={i} value={i} style={{ background:"#18181b" }}>{m}</option>)}
          </select>
        </div>
        <div style={{ display:"flex" }}>
          <NavBtn id="dash" label="Przegląd" />
          <NavBtn id="add"  label="Dodaj" />
          <NavBtn id="list" label="Historia" />
        </div>
      </div>

      <div style={{ padding:"20px 16px 40px", maxWidth:600, margin:"0 auto" }}>

        {loading && <div style={{ textAlign:"center", padding:"60px 0", color:"rgba(255,255,255,0.3)", fontSize:14 }}>Ładowanie danych…</div>}

        {!loading && view === "dash" && <>
          <div style={{ textAlign:"center", padding:"28px 0 24px" }}>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>{MONTHS[month]} {year}</div>
            <div style={{ fontSize:46, fontWeight:700, letterSpacing:"-2px", lineHeight:1 }}>
              {fmt(total)}<span style={{ fontSize:20, fontWeight:400, color:"rgba(255,255,255,0.4)", marginLeft:4 }}>zł</span>
            </div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginTop:8 }}>{filtered.length} transakcji</div>
          </div>

          {byCat.length === 0
            ? <div style={{ textAlign:"center", padding:"60px 0", color:"rgba(255,255,255,0.2)", fontSize:15 }}>Brak wydatków w tym miesiącu</div>
            : <>
              <div style={{ background:"rgba(255,255,255,0.04)", borderRadius:16, border:"1px solid rgba(255,255,255,0.07)", padding:"20px 16px 12px", marginBottom:14 }}>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:4 }}>Podział</div>
                <ResponsiveContainer width="100%" height={190}>
                  <PieChart>
                    <Pie data={byCat} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={82} paddingAngle={3} strokeWidth={0}>
                      {byCat.map((e,i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={v => `${fmt(v)} zł`} contentStyle={{ background:"#18181b", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, fontSize:13 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background:"rgba(255,255,255,0.04)", borderRadius:16, border:"1px solid rgba(255,255,255,0.07)", padding:"16px", marginBottom:14 }}>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:14 }}>Kategorie</div>
                {byCat.map(c => {
                  const pct = total > 0 ? (c.value/total*100) : 0;
                  return (
                    <div key={c.name} style={{ marginBottom:14 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ fontSize:14 }}>{c.icon}</span>
                          <span style={{ fontSize:13, color:"rgba(255,255,255,0.8)" }}>{c.name}</span>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>{pct.toFixed(0)}%</span>
                          <span style={{ fontSize:14, fontWeight:600 }}>{fmt(c.value)} zł</span>
                        </div>
                      </div>
                      <div style={{ height:3, background:"rgba(255,255,255,0.07)", borderRadius:99 }}>
                        <div style={{ width:`${pct}%`, height:"100%", background:c.color, borderRadius:99, transition:"width .6s cubic-bezier(.4,0,.2,1)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {byDay.length > 1 && <div style={{ background:"rgba(255,255,255,0.04)", borderRadius:16, border:"1px solid rgba(255,255,255,0.07)", padding:"16px", marginBottom:14 }}>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:14 }}>Dzień po dniu</div>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={byDay} margin={{ top:0, right:0, left:-28, bottom:0 }}>
                    <XAxis dataKey="day" tick={{ fontSize:11, fill:"rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize:11, fill:"rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={v => `${fmt(v)} zł`} contentStyle={{ background:"#18181b", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, fontSize:13 }} />
                    <Bar dataKey="amt" fill="#a78bfa" radius={[5,5,2,2]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>}
            </>
          }
        </>}

        {!loading && view === "add" && <>
          <div style={{ paddingTop:8, marginBottom:24 }}>
            <div style={{ fontSize:22, fontWeight:700, letterSpacing:"-0.5px" }}>Nowy wydatek</div>
          </div>
          {err && <div style={{ background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#fca5a5", marginBottom:16 }}>{err}</div>}

          <Label>Opis</Label>
          <input placeholder="np. Biedronka, Netflix…" value={form.desc}
            onChange={e => { setErr(""); setForm(f=>({...f,desc:e.target.value})); }}
            style={inp} />

          <Label>Kwota (zł)</Label>
          <input type="number" placeholder="0,00" value={form.amount}
            onChange={e => { setErr(""); setForm(f=>({...f,amount:e.target.value})); }}
            style={inp} />

          <Label>Kategoria</Label>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16 }}>
            {CATS.map(c => (
              <button key={c.name} onClick={() => setForm(f=>({...f,cat:c.name}))} style={{
                display:"flex", alignItems:"center", gap:8, padding:"10px 12px",
                background: form.cat===c.name ? "rgba(167,139,250,0.15)" : "rgba(255,255,255,0.04)",
                border: form.cat===c.name ? "1px solid rgba(167,139,250,0.5)" : "1px solid rgba(255,255,255,0.08)",
                borderRadius:10, color: form.cat===c.name ? "#c4b5fd" : "rgba(255,255,255,0.6)",
                fontSize:13, cursor:"pointer", fontWeight: form.cat===c.name ? 600 : 400, transition:"all .15s"
              }}>
                <span style={{ fontSize:14 }}>{c.icon}</span>{c.name}
              </button>
            ))}
          </div>

          <Label>Data</Label>
          <input type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} style={inp} />

          <button onClick={add} disabled={saving} style={{
            width:"100%", padding:"14px", background: saving ? "#6d5fa6" : "#a78bfa",
            border:"none", borderRadius:12, color:"#09090b", fontWeight:700, fontSize:15,
            cursor: saving ? "not-allowed" : "pointer", marginTop:4, letterSpacing:"-0.2px", transition:"opacity .15s"
          }}>
            {saving ? "Zapisywanie…" : "Dodaj wydatek"}
          </button>
        </>}

        {!loading && view === "list" && <>
          <div style={{ paddingTop:8, marginBottom:20 }}>
            <div style={{ fontSize:22, fontWeight:700, letterSpacing:"-0.5px" }}>Historia</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.35)", marginTop:2 }}>{MONTHS[month]} {year} · {filtered.length} transakcji</div>
          </div>
          {filtered.length === 0
            ? <div style={{ textAlign:"center", padding:"60px 0", color:"rgba(255,255,255,0.2)", fontSize:15 }}>Brak wydatków</div>
            : <div style={{ background:"rgba(255,255,255,0.04)", borderRadius:16, border:"1px solid rgba(255,255,255,0.07)", overflow:"hidden" }}>
                {filtered.map((e, i) => {
                  const c = cat(e.cat);
                  const desc = e.description || e.desc || "—";
                  return (
                    <div key={e.id} style={{
                      display:"flex", alignItems:"center", gap:12, padding:"13px 16px",
                      borderBottom: i < filtered.length-1 ? "1px solid rgba(255,255,255,0.06)" : "none"
                    }}>
                      <div style={{ width:36, height:36, borderRadius:10, background:`${c.color}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>
                        {c.icon}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:14, fontWeight:500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{desc}</div>
                        <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginTop:1 }}>{c.name} · {e.date}</div>
                      </div>
                      <div style={{ fontWeight:700, fontSize:15, flexShrink:0 }}>{fmt(parseFloat(e.amount))} zł</div>
                      <button onClick={() => del(e.id)} style={{
                        background:"none", border:"none", color:"rgba(255,255,255,0.2)",
                        cursor:"pointer", fontSize:18, padding:"2px 0 2px 8px", lineHeight:1, flexShrink:0
                      }}
                        onMouseOver={ev=>ev.target.style.color="#ef4444"}
                        onMouseOut={ev=>ev.target.style.color="rgba(255,255,255,0.2)"}
                      >×</button>
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

const inp = {
  width:"100%", padding:"12px 14px", background:"rgba(255,255,255,0.05)",
  border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, color:"#fafafa",
  fontSize:14, marginBottom:16, boxSizing:"border-box", outline:"none"
};
function Label({ children }) {
  return <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:7, fontWeight:500 }}>{children}</div>;
}