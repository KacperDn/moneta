import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

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

      <main className="auth-shell__content">
        {onBack && (
          <button type="button" className="auth-shell__back" onClick={onBack} aria-label={t("settings.backAria")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
        {children}
      </main>
    </div>
  );
}
