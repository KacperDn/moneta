import { useState } from "react";
import { supabase } from "./supabase";
import "./styles/main.scss";

export default function Auth() {
  const [mode, setMode]       = useState("login");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState("");
  const [info, setInfo]       = useState("");

  const handle = async () => {
    if (!email.trim() || !password.trim()) return setErr("Wypełnij wszystkie pola.");
    if (password.length < 6) return setErr("Hasło musi mieć minimum 6 znaków.");
    setLoading(true); setErr(""); setInfo("");

    const { error } = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (error) setErr(error.message);
    else if (mode === "register") setInfo("Konto utworzone! Możesz się teraz zalogować.");
    setLoading(false);
  };

  return (
    <div className="auth">
      <div className="auth__inner">

        <div className="auth__logo">
          <div className="auth__logo-text">moneta</div>
          <div className="auth__logo-sub">personal finance</div>
        </div>

        <div className="auth__card">
          <div className="auth__title">
            {mode === "login" ? "Zaloguj się" : "Utwórz konto"}
          </div>
          <div className="auth__subtitle">
            {mode === "login" ? "Witaj z powrotem 👋" : "Zacznij śledzić wydatki"}
          </div>

          {err  && <div className="alert alert--error">{err}</div>}
          {info && <div className="alert alert--success">{info}</div>}

          <label className="form__label">Email</label>
          <input
            type="email"
            placeholder="twoj@email.com"
            value={email}
            className="form__input"
            onChange={e => { setErr(""); setEmail(e.target.value); }}
            onKeyDown={e => e.key === "Enter" && handle()}
          />

          <label className="form__label">Hasło</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            className="form__input"
            onChange={e => { setErr(""); setPassword(e.target.value); }}
            onKeyDown={e => e.key === "Enter" && handle()}
          />

          <button className="btn--primary" onClick={handle} disabled={loading}>
            {loading ? "Ładowanie…" : mode === "login" ? "Zaloguj się" : "Utwórz konto"}
          </button>

          <div className="auth__switch">
            {mode === "login" ? "Nie masz konta? " : "Masz już konto? "}
            <button className="btn--ghost" onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(""); setInfo(""); }}>
              {mode === "login" ? "Zarejestruj się" : "Zaloguj się"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}