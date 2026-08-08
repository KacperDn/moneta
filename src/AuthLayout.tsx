import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { IconChevronLeft } from "./icons";

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
            {IconChevronLeft}
          </button>
        )}
        {children}
      </main>
    </div>
  );
}
