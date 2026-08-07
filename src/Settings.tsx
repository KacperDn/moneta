import { IconChevronLeft } from "./icons";
import { Theme } from "./hooks/useTheme";

interface Props {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onBack: () => void;
  email?: string;
  onLogout?: () => void;
}

export default function Settings({ email, theme, onThemeChange, onBack, onLogout }: Props) {
  return (
    <div className="settings">
      <div className="auth-glow auth-glow--1" />
      <div className="auth-glow auth-glow--2" />

      <header className="settings__header">
        <button type="button" className="settings__back" onClick={onBack} aria-label="Wróć">
          {IconChevronLeft}
        </button>
        <div className="settings__title">Ustawienia</div>
      </header>

      <div className="settings__container">
        {email && (
          <div className="settings__group">
            <div className="settings__group-title">Konto</div>
            <div className="card card--list">
              <div className="settings__row">
                <span>Email</span>
                <span className="settings__row-value">{email}</span>
              </div>
            </div>
          </div>
        )}

        <div className="settings__group">
          <div className="settings__group-title">Wygląd i język</div>
          <div className="card card--list">
            <div className="settings__row">
              <span>Motyw</span>
              <div className="settings__theme-toggle">
                <button
                  type="button"
                  className={`settings__theme-btn${theme === "dark" ? " settings__theme-btn--active" : ""}`}
                  onClick={() => onThemeChange("dark")}
                >
                  Ciemny
                </button>
                <button
                  type="button"
                  className={`settings__theme-btn${theme === "light" ? " settings__theme-btn--active" : ""}`}
                  onClick={() => onThemeChange("light")}
                >
                  Jasny
                </button>
              </div>
            </div>
            <div className="settings__row">
              <span>Język</span>
              <span className="settings__row-value">Polski <span className="settings__badge">wkrótce</span></span>
            </div>
          </div>
        </div>

        {email && (
          <div className="settings__group">
            <div className="settings__group-title">Wydatki</div>
            <div className="card card--list">
              <div className="settings__row">
                <span>Kategorie</span>
                <span className="settings__row-value"><span className="settings__badge">wkrótce</span></span>
              </div>
            </div>
          </div>
        )}

        <div className="settings__group">
          <div className="settings__group-title">Prawne</div>
          <div className="card card--list">
            <div className="settings__row">
              <span>Polityka prywatności</span>
              <span className="settings__row-value"><span className="settings__badge">wkrótce</span></span>
            </div>
          </div>
        </div>

        {onLogout && (
          <button type="button" className="settings__logout" onClick={onLogout}>Wyloguj się</button>
        )}
      </div>
    </div>
  );
}
