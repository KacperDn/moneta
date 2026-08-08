import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "./lib/supabase";
import { friendlyAuthError } from "./lib/errors";
import { IconEye, IconEyeOff } from "./icons";
import AuthLayout from "./AuthLayout";
import "./styles/main.scss";

export default function PasswordReset() {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState("");
  const [done, setDone]         = useState(false);

  const handle = async () => {
    if (password.length < 6) return setErr(t("passwordReset.errPasswordLength"));
    setLoading(true);
    setErr("");

    const params = new URLSearchParams(window.location.search);
    const token  = params.get("token");

    if (!token) {
      setErr(t("passwordReset.errNoToken"));
      setLoading(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: "recovery",
    });

    if (verifyError) {
      setErr(t("passwordReset.errLinkExpired"));
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
    <AuthLayout>
      <div className="auth-form__title">{t("passwordReset.title")}</div>
      <div className="auth-form__subtitle">{t("passwordReset.subtitle")}</div>

      {err  && <div className="alert alert--error">{err}</div>}
      {done && <div className="alert alert--success">{t("passwordReset.success")}</div>}

      {!done && (
        <form onSubmit={e => { e.preventDefault(); handle(); }}>
          <label className="form__label">{t("passwordReset.label")}</label>
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
              {showPass ? IconEyeOff : IconEye}
            </button>
          </div>
          <button type="submit" className="btn--primary" disabled={loading}>
            {loading && <span className="btn__spinner" />}
            {loading ? t("passwordReset.submitLoading") : t("passwordReset.submitIdle")}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
