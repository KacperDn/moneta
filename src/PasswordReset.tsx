import { useState } from "react";
import { supabase } from "./lib/supabase";
import { friendlyAuthError } from "./lib/errors";
import "./styles/main.scss";

export default function PasswordReset() {
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState("");
  const [done, setDone]         = useState(false);

  const handle = async () => {
    if (password.length < 6) return setErr("Hasło musi mieć minimum 6 znaków.");
    setLoading(true);
    setErr("");

    const params = new URLSearchParams(window.location.search);
    const token  = params.get("token");

    if (!token) {
      setErr("Brak tokenu resetowania. Spróbuj ponownie.");
      setLoading(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: "recovery",
    });

    if (verifyError) {
      setErr("Link wygasł lub jest nieprawidłowy. Wyślij nowy link.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) return setErr(friendlyAuthError(error.message));

    setDone(true);
    window.history.replaceState({}, "", window.location.pathname);
    await supabase.auth.signOut();
  };

  return (
    <div className="auth">
      <div className="auth__inner">

        <div className="auth__logo">
          <div className="auth__logo-text">moneta</div>
          <div className="auth__logo-sub">personal finance</div>
        </div>

        <div className="auth__card">
          <div className="auth__title">Nowe hasło</div>
          <div className="auth__subtitle">Ustaw nowe hasło do swojego konta</div>

          {err  && <div className="alert alert--error">{err}</div>}
          {done && <div className="alert alert--success">Hasło zostało zmienione! Możesz się teraz zalogować.</div>}

          {!done && (
            <form onSubmit={e => { e.preventDefault(); handle(); }}>
              <label className="form__label">Nowe hasło</label>
              <div className="form__input-wrap">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  className="form__input form__input--pass"
                  autoComplete="new-password"
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
              <button type="submit" className="btn--primary" disabled={loading}>
                {loading ? "Zapisywanie…" : "Zmień hasło"}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}