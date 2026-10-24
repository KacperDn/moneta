import { MouseEvent, PointerEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { IconPieChart, IconTrendingUp, IconCloud, IconShield, IconPalette, IconSettings } from "./icons";
import { Theme } from "./hooks/useTheme";
import { revealProps } from "./hooks/useScrollReveal";
import Settings from "./Settings";
import DashboardMock from "./components/DashboardMock";

const SWIPE_MOVE_THRESHOLD = 6;
const SWIPE_TRIGGER_THRESHOLD = 40;

interface Slide {
  icon: ReactNode;
  title: string;
  desc: string;
}

const SLIDE_ICONS = [IconPieChart, IconTrendingUp, IconPalette, IconCloud, IconShield];

function offsetOf(i: number, active: number, n: number) {
  const wrapped = ((i - active) % n + n) % n;
  return wrapped > n / 2 ? wrapped - n : wrapped;
}

function offsetClass(offset: number) {
  if (offset === 0) return "center";
  if (offset === 1) return "right";
  if (offset === -1) return "left";
  return "back";
}

function scrollToSection(id: string) {
  return (e: MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
}

interface Props {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onGetStarted: () => void;
}

export default function Landing({ theme, onThemeChange, onGetStarted }: Props) {
  const { t } = useTranslation();
  const [showSettings, setShowSettings] = useState(false);
  const [active, setActive] = useState(0);
  const dragState = useRef({ startX: 0, moved: false });
  const suppressClick = useRef(false);

  const SLIDES: Slide[] = useMemo(() => {
    const translated = t("landing.slides", { returnObjects: true }) as { title: string; desc: string }[];
    return translated.map((s, i) => ({ icon: SLIDE_ICONS[i], title: s.title, desc: s.desc }));
  }, [t]);

  useEffect(() => {
    const id = setTimeout(() => setActive(a => (a + 1) % SLIDES.length), 5000);
    return () => clearTimeout(id);
  }, [active, SLIDES.length]);

  const next = () => setActive(a => (a + 1) % SLIDES.length);
  const prev = () => setActive(a => (a - 1 + SLIDES.length) % SLIDES.length);

  const onPointerDown = (e: PointerEvent) => {
    dragState.current = { startX: e.clientX, moved: false };
  };

  const onPointerMove = (e: PointerEvent) => {
    if (Math.abs(e.clientX - dragState.current.startX) > SWIPE_MOVE_THRESHOLD) {
      dragState.current.moved = true;
    }
  };

  const onPointerUp = (e: PointerEvent) => {
    if (!dragState.current.moved) return;
    suppressClick.current = true;
    const delta = e.clientX - dragState.current.startX;
    if (Math.abs(delta) > SWIPE_TRIGGER_THRESHOLD) {
      if (delta < 0) next(); else prev();
    }
  };

  const handleCardClick = (offset: number) => {
    if (suppressClick.current) { suppressClick.current = false; return; }
    if (offset === 1) next();
    else if (offset === -1) prev();
  };

  if (showSettings) {
    return (
      <Settings
        theme={theme}
        onThemeChange={onThemeChange}
        onBack={() => setShowSettings(false)}
      />
    );
  }

  const steps = t("landing.steps", { returnObjects: true }) as { title: string; desc: string }[];

  return (
    <div className="landing">
      <div className="auth-glow auth-glow--1" />
      <div className="auth-glow auth-glow--2" />
      <div className="landing__progress" aria-hidden="true" />

      <header className="landing__header">
        <span className="landing__logo">moneta</span>
        <nav className="landing__nav">
          <a href="#features" onClick={scrollToSection("features")}>{t("landing.navFeatures")}</a>
          <a href="#how" onClick={scrollToSection("how")}>{t("landing.navHow")}</a>
        </nav>
        <div className="landing__header-actions">
          <button type="button" className="landing__login" onClick={onGetStarted}>{t("landing.cta")}</button>
          <button
            type="button"
            className="header__settings"
            onClick={() => setShowSettings(true)}
            aria-label={t("landing.settingsAria")}
          >
            {IconSettings}
          </button>
        </div>
      </header>

      <main className="landing__hero">
        <h1 className="landing__title">{t("landing.title")}</h1>
        <p className="landing__subtitle">{t("landing.subtitle")}</p>

        <div
          className="carousel"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          {SLIDES.map((s, i) => {
            const offset = offsetOf(i, active, SLIDES.length);
            const cls = offsetClass(offset);
            const interactive = cls === "center" || cls === "left" || cls === "right";
            return (
              <button
                key={i}
                type="button"
                className={`carousel__card carousel__card--${cls}`}
                onClick={() => handleCardClick(offset)}
                tabIndex={interactive ? 0 : -1}
                aria-hidden={!interactive}
              >
                <div className="carousel__icon-bg">{s.icon}</div>
                <div className="carousel__content">
                  <div className="carousel__title">{s.title}</div>
                  <div className="carousel__desc">{s.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="carousel__dots">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`carousel__dot${i === active ? " carousel__dot--active" : ""}`}
              onClick={() => setActive(i)}
              aria-label={t("landing.cardAria", { n: i + 1 })}
            />
          ))}
        </div>

        <div className="landing__actions">
          <button type="button" className="btn--primary landing__cta" onClick={onGetStarted}>
            {t("landing.cta")}
          </button>
          <a href="#features" className="landing__secondary" onClick={scrollToSection("features")}>
            {t("landing.ctaSecondary")}
          </a>
        </div>

        <DashboardMock />
      </main>

      <section id="features" className="lp-section lp-section--features">
        <div className="lp-section__head" {...revealProps()}>
          <h2 className="lp-section__title">{t("landing.featuresTitle")}</h2>
          <p className="lp-section__sub">{t("landing.featuresSub")}</p>
        </div>
        <div className="lp-grid">
          {SLIDES.map((s, i) => (
            <article key={i} className="lp-feature" {...revealProps(i % 3)}>
              <div className="lp-feature__icon">{s.icon}</div>
              <h3 className="lp-feature__title">{s.title}</h3>
              <p className="lp-feature__desc">{s.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how" className="lp-section">
        <div className="lp-section__head" {...revealProps()}>
          <h2 className="lp-section__title">{t("landing.howTitle")}</h2>
        </div>
        <ol className="lp-steps">
          {steps.map((step, i) => (
            <li key={i} className="lp-step" {...revealProps(i)}>
              <span className="lp-step__num">{i + 1}</span>
              <h3 className="lp-step__title">{step.title}</h3>
              <p className="lp-step__desc">{step.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="lp-cta" {...revealProps()}>
        <h2 className="lp-cta__title">{t("landing.ctaTitle")}</h2>
        <p className="lp-cta__sub">{t("landing.ctaSub")}</p>
        <button type="button" className="btn--primary landing__cta" onClick={onGetStarted}>
          {t("landing.cta")}
        </button>
      </section>

      <footer className="landing__footer">{t("landing.footer")}</footer>
    </div>
  );
}
