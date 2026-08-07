import { PointerEvent, ReactNode, useEffect, useRef, useState } from "react";
import { IconPieChart, IconTrendingUp, IconCloud, IconShield, IconSettings } from "./icons";
import { Theme } from "./hooks/useTheme";
import Settings from "./Settings";

const SWIPE_MOVE_THRESHOLD = 6;
const SWIPE_TRIGGER_THRESHOLD = 40;

interface Slide {
  icon: ReactNode;
  title: string;
  desc: string;
}

const SLIDES: Slide[] = [
  { icon: IconPieChart,   title: "Zobacz, gdzie mkną pieniądze", desc: "Automatyczny podział na kategorie z przejrzystymi wykresami." },
  { icon: IconTrendingUp, title: "Śledź trendy miesiąc po miesiącu", desc: "Porównuj miesiące i zauważaj wzorce w wydatkach." },
  { icon: IconCloud,      title: "Twoje dane zawsze przy Tobie", desc: "Dostęp z telefonu i komputera — zawsze zsynchronizowane." },
  { icon: IconShield,     title: "Prywatność na pierwszym miejscu", desc: "Twoje dane widzisz tylko Ty, zabezpieczone na poziomie bazy." },
];

function offsetOf(i: number, active: number) {
  const n = SLIDES.length;
  const wrapped = ((i - active) % n + n) % n;
  return wrapped > n / 2 ? wrapped - n : wrapped;
}

function offsetClass(offset: number) {
  if (offset === 0) return "center";
  if (offset === 1) return "right";
  if (offset === -1) return "left";
  return "back";
}

interface Props {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onGetStarted: () => void;
}

export default function Landing({ theme, onThemeChange, onGetStarted }: Props) {
  const [showSettings, setShowSettings] = useState(false);
  const [active, setActive] = useState(0);
  const dragState = useRef({ startX: 0, moved: false });
  const suppressClick = useRef(false);

  useEffect(() => {
    const id = setTimeout(() => setActive(a => (a + 1) % SLIDES.length), 5000);
    return () => clearTimeout(id);
  }, [active]);

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

  return (
    <div className="landing">
      <div className="auth-glow auth-glow--1" />
      <div className="auth-glow auth-glow--2" />

      <header className="landing__header">
        <span className="landing__logo">moneta</span>
        <button
          type="button"
          className="header__settings"
          onClick={() => setShowSettings(true)}
          aria-label="Ustawienia"
        >
          {IconSettings}
        </button>
      </header>

      <main className="landing__hero">
        <h1 className="landing__title">Zobacz, gdzie naprawdę idą Twoje pieniądze</h1>
        <p className="landing__subtitle">Proste śledzenie wydatków, przejrzyste wykresy i cele budżetowe — wszystko w jednym miejscu.</p>

        <div
          className="carousel"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          {SLIDES.map((s, i) => {
            const offset = offsetOf(i, active);
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
              aria-label={`Karta ${i + 1}`}
            />
          ))}
        </div>

        <button type="button" className="btn--primary landing__cta" onClick={onGetStarted}>
          Zaloguj się
        </button>
      </main>

      <footer className="landing__footer">moneta · aplikacja do śledzenia wydatków</footer>
    </div>
  );
}
