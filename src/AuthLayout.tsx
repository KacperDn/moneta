import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { IconChevronLeft } from "./icons";
import DashboardMock from "./components/DashboardMock";

interface Props {
  children: ReactNode;
  onBack?: () => void;
}

export default function AuthLayout({ children, onBack }: Props) {
  const { t } = useTranslation();
  return (
    <div className="auth-shell">
      <div className="auth-glow auth-glow--1" />
      <div className="auth-glow auth-glow--2" />

      <header className="auth-shell__header">
        <span className="auth-shell__logo">moneta</span>
      </header>

      <aside className="auth-shell__aside" aria-hidden="true">
        <span className="auth-shell__aside-logo">moneta</span>
        <h2 className="auth-shell__aside-title">{t("landing.title")}</h2>
        <p className="auth-shell__aside-sub">{t("landing.subtitle")}</p>
        <DashboardMock />
      </aside>

      <div className="auth-shell__panel">
        {onBack && (
          <button type="button" className="auth-shell__back" onClick={onBack}>
            {IconChevronLeft}
            <span>{t("auth.backHome")}</span>
          </button>
        )}

        <main className="auth-shell__content">
          {children}
        </main>
      </div>
    </div>
  );
}
