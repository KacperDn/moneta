import { useState } from "react";
import { useTranslation } from "react-i18next";
import { IconChevronLeft } from "./icons";
import { Theme } from "./hooks/useTheme";
import { useLanguage } from "./hooks/useLanguage";
import PrivacyPolicy from "./PrivacyPolicy";

interface Props {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onBack: () => void;
  email?: string;
  onLogout?: () => void;
}

export default function Settings({ email, theme, onThemeChange, onBack, onLogout }: Props) {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const [showPrivacy, setShowPrivacy] = useState(false);

  if (showPrivacy) {
    return <PrivacyPolicy onBack={() => setShowPrivacy(false)} />;
  }

  return (
    <div className="settings">
      <div className="auth-glow auth-glow--1" />
      <div className="auth-glow auth-glow--2" />

      <header className="settings__header">
        <button type="button" className="settings__back" onClick={onBack} aria-label={t("settings.backAria")}>
          {IconChevronLeft}
        </button>
        <div className="settings__title">{t("settings.title")}</div>
      </header>

      <div className="settings__container">
        {email && (
          <div className="settings__group">
            <div className="settings__group-title">{t("settings.groupAccount")}</div>
            <div className="card card--list">
              <div className="settings__row">
                <span>{t("settings.email")}</span>
                <span className="settings__row-value">{email}</span>
              </div>
            </div>
          </div>
        )}

        <div className="settings__group">
          <div className="settings__group-title">{t("settings.groupAppearance")}</div>
          <div className="card card--list">
            <div className="settings__row">
              <span>{t("settings.theme")}</span>
              <div className="settings__theme-toggle">
                <button
                  type="button"
                  className={`settings__theme-btn${theme === "dark" ? " settings__theme-btn--active" : ""}`}
                  onClick={() => onThemeChange("dark")}
                >
                  {t("settings.themeDark")}
                </button>
                <button
                  type="button"
                  className={`settings__theme-btn${theme === "light" ? " settings__theme-btn--active" : ""}`}
                  onClick={() => onThemeChange("light")}
                >
                  {t("settings.themeLight")}
                </button>
              </div>
            </div>
            <div className="settings__row">
              <span>{t("settings.language")}</span>
              <div className="settings__theme-toggle">
                <button
                  type="button"
                  className={`settings__theme-btn${language === "pl" ? " settings__theme-btn--active" : ""}`}
                  onClick={() => setLanguage("pl")}
                >
                  {t("settings.languagePolish")}
                </button>
                <button
                  type="button"
                  className={`settings__theme-btn${language === "en" ? " settings__theme-btn--active" : ""}`}
                  onClick={() => setLanguage("en")}
                >
                  {t("settings.languageEnglish")}
                </button>
              </div>
            </div>
          </div>
        </div>

        {email && (
          <div className="settings__group">
            <div className="settings__group-title">{t("settings.groupExpenses")}</div>
            <div className="card card--list">
              <div className="settings__row">
                <span>{t("settings.categories")}</span>
                <span className="settings__row-value"><span className="settings__badge">{t("settings.comingSoon")}</span></span>
              </div>
            </div>
          </div>
        )}

        <div className="settings__group">
          <div className="settings__group-title">{t("settings.groupLegal")}</div>
          <div className="card card--list">
            <button type="button" className="settings__row settings__row--link" onClick={() => setShowPrivacy(true)}>
              <span>{t("settings.privacyPolicy")}</span>
              <span className="settings__row-chevron">{IconChevronLeft}</span>
            </button>
          </div>
        </div>

        {onLogout && (
          <button type="button" className="settings__logout" onClick={onLogout}>{t("settings.logout")}</button>
        )}
      </div>
    </div>
  );
}
