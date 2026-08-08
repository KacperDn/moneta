import { Trans, useTranslation } from "react-i18next";
import { IconChevronLeft } from "./icons";

interface Props {
  onBack: () => void;
}

const CONTACT_EMAIL = "praktykikd@gmail.com";

const SECTION_KEYS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export default function PrivacyPolicy({ onBack }: Props) {
  const { t } = useTranslation();

  return (
    <div className="settings">
      <div className="auth-glow auth-glow--1" />
      <div className="auth-glow auth-glow--2" />

      <header className="settings__header">
        <button type="button" className="settings__back" onClick={onBack} aria-label={t("settings.backAria")}>
          {IconChevronLeft}
        </button>
        <div className="settings__title">{t("privacy.title")}</div>
      </header>

      <div className="settings__container">
        <div className="legal__updated">{t("privacy.updated")}</div>

        {SECTION_KEYS.map(n => (
          <div className="legal__section" key={n}>
            <div className="legal__heading">{t(`privacy.s${n}_heading`)}</div>
            <div className="legal__text">
              {n === 1 || n === 8 ? (
                <Trans
                  i18nKey={`privacy.s${n}_body`}
                  values={{ email: CONTACT_EMAIL }}
                  components={{ a: <a href={`mailto:${CONTACT_EMAIL}`} className="legal__link" /> }}
                />
              ) : (
                t(`privacy.s${n}_body`).split("\n\n").map((para, i) => (
                  <span key={i}>
                    {i > 0 && <><br /><br /></>}
                    {para}
                  </span>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
