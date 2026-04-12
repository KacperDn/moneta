import { useState } from "react";
import { supabase } from "./lib/supabase";
import "./styles/main.scss";

type Mode = "login" | "register" | "reset";

export default function Auth() {
  const [mode, setMode]         = useState<Mode>("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState("");
  const [info, setInfo]         = useState("");
  const [showPass, setShowPass] = useState(false);

  const handle = async () => {
    setErr(""); setInfo("");
    if (!email.trim()) return setErr("Wpisz adres email.");

    if (mode === "reset") {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      setLoading(false);
      if (error) return setErr(error.message);
      return setInfo("Link do resetowania hasła został wysłany na podany adres email.");
    }

    if (!password.trim()) return setErr("Wpisz hasło.");
    if (password.length < 6) return setErr("Hasło musi mieć minimum 6 znaków.");

    setLoading(true);
    const { error } = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) return setErr(error.message);
    if (mode === "register") setInfo("Konto utworzone! Możesz się teraz zalogować.");
  };

  const switchMode = (m: Mode) => { setMode(m); setErr(""); setInfo(""); };

  return (
    <div className="auth">
      <div className="auth__inner">

        <div className="auth__logo">
          <div className="auth__logo-text">moneta</div>
          <div className="auth__logo-sub">personal finance</div>
        </div>

        <div className="auth__card">
          <div className="auth__title">
            {mode === "login" ? "Zaloguj się" : mode === "register" ? "Utwórz konto" : "Reset hasła"}
          </div>
          <div className="auth__subtitle">
            {mode === "login" ? "Witaj z powrotem 👋" : mode === "register" ? "Zacznij śledzić wydatki" : "Wyślemy Ci link na email"}
          </div>

          {err  && <div className="alert alert--error">{err}</div>}
          {info && <div className="alert alert--success">{info}</div>}

          <form onSubmit={e => { e.preventDefault(); handle(); }} autoComplete="on">
            <label className="form__label">Email</label>
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="twoj@email.com"
              value={email}
              className="form__input"
              onChange={e => { setErr(""); setEmail(e.target.value); }}
            />

            {mode !== "reset" && <>
              <label className="form__label">Hasło</label>
              <div className="form__input-wrap">
                <input
                  type={showPass ? "text" : "password"}
                  name="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder="••••••••"
                  value={password}
                  className="form__input form__input--pass"
                  onChange={e => { setErr(""); setPassword(e.target.value); }}
                />
                <button type="button" className="form__pass-toggle" onClick={() => setShowPass(p => !p)}>
                  {showPass ? (
                    <svg viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </>}

            <button type="submit" className="btn--primary" disabled={loading}>
              {loading ? "Ładowanie…" : mode === "login" ? "Zaloguj się" : mode === "register" ? "Utwórz konto" : "Wyślij link"}
            </button>
          </form>

          <div className="auth__switch">
            {mode === "login" && <>
              <button className="btn--ghost" onClick={() => switchMode("reset")}>Zapomniałem hasła</button>
              <span style={{ margin: "0 8px", opacity: 0.3 }}>·</span>
              <button className="btn--ghost" onClick={() => switchMode("register")}>Zarejestruj się</button>
            </>}
            {mode === "register" && (
              <button className="btn--ghost" onClick={() => switchMode("login")}>Mam już konto</button>
            )}
            {mode === "reset" && (
              <button className="btn--ghost" onClick={() => switchMode("login")}>Wróć do logowania</button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}