import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "./lib/supabase";
import { friendlyAuthError } from "./lib/errors";
import AuthLayout from "./AuthLayout";
import "./styles/main.scss";

type Mode = "login" | "register" | "reset";

interface Props {
  onBack?: () => void;
}

export default function Auth({ onBack }: Props) {
  const { t } = useTranslation();
  const [mode, setMode]         = useState<Mode>("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState("");
  const [info, setInfo]         = useState("");
  const [showPass, setShowPass] = useState(false);

  const handle = async () => {
    setErr(""); setInfo("");
    if (!email.trim()) return setErr(t("auth.errEmailRequired"));

    if (mode === "reset") {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      setLoading(false);
      if (error) return setErr(friendlyAuthError(error.message));
      return setInfo(t("auth.infoResetSent"));
    }

    if (!password.trim()) return setErr(t("auth.errPasswordRequired"));
    if (password.length < 6) return setErr(t("auth.errPasswordLength"));

    setLoading(true);
    const { error } = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) return setErr(friendlyAuthError(error.message));
    if (mode === "register") setInfo(t("auth.infoRegisterSuccess"));
  };

  const switchMode = (m: Mode) => { setMode(m); setErr(""); setInfo(""); };

  return (
    <AuthLayout onBack={onBack}>
      <div className="auth-form__title">
        {mode === "login" ? t("auth.titleLogin") : mode === "register" ? t("auth.titleRegister") : t("auth.titleReset")}
      </div>

      {err  && <div className="alert alert--error">{err}</div>}
      {info && <div className="alert alert--success">{info}</div>}

      <form onSubmit={e => { e.preventDefault(); handle(); }} autoComplete="on">
        <label className="form__label">{t("auth.emailLabel")}</label>
        <input
          type="email"
          name="email"
          autoComplete="email"
          placeholder={t("auth.emailPlaceholder")}
          value={email}
          className="form__input"
          onChange={e => { setErr(""); setEmail(e.target.value); }}
        />

        {mode !== "reset" && <>
          <label className="form__label">{t("auth.passwordLabel")}</label>
          <div className="form__input-wrap">
            <input
              type={showPass ? "text" : "password"}
              name="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder={t("auth.passwordPlaceholder")}
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
          {loading && <span className="btn__spinner" />}
          {loading ? t("auth.submitLoading") : mode === "login" ? t("auth.submitLogin") : mode === "register" ? t("auth.submitRegister") : t("auth.submitReset")}
        </button>
      </form>

      <div className="auth-form__switch">
        {mode === "login" && <>
          <button className="btn--ghost" onClick={() => switchMode("reset")}>{t("auth.forgotPassword")}</button>
          <span style={{ margin: "0 8px", opacity: 0.3 }}>·</span>
          <button className="btn--ghost" onClick={() => switchMode("register")}>{t("auth.createAccount")}</button>
        </>}
        {mode === "register" && (
          <button className="btn--ghost" onClick={() => switchMode("login")}>{t("auth.haveAccount")}</button>
        )}
        {mode === "reset" && (
          <button className="btn--ghost" onClick={() => switchMode("login")}>{t("auth.backToLogin")}</button>
        )}
      </div>
    </AuthLayout>
  );
}
