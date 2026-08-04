import { PointerEvent, ReactNode, useEffect, useRef, useState } from "react";
import { IconPieChart, IconTrendingUp, IconCloud, IconShield } from "./icons";

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

interface Props {
  children: ReactNode;
}

export default function AuthLayout({ children }: Props) {
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

  const handleCardClick = () => {
    if (suppressClick.current) { suppressClick.current = false; return; }
    next();
  };

  return (
    <div className="auth-shell">
      <div className="auth-glow auth-glow--1" />
      <div className="auth-glow auth-glow--2" />

      <header className="auth-header">
        <span className="auth-header__logo">moneta</span>
      </header>

      <div className="auth-scene">
        <aside className="auth-promo">
          <div
            className="auth-stack"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            {SLIDES.map((s, i) => {
              const pos = (i - active + SLIDES.length) % SLIDES.length;
              const hidden = pos === SLIDES.length - 1;
              return (
                <button
                  key={i}
                  type="button"
                  className={`auth-stack__card auth-stack__card--pos${pos}`}
                  onClick={handleCardClick}
                  tabIndex={hidden ? -1 : 0}
                  aria-hidden={hidden}
                >
                  <div className="auth-stack__content">
                    <div className="auth-stack__icon">{s.icon}</div>
                    <div className="auth-stack__title">{s.title}</div>
                    <div className="auth-stack__desc">{s.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="auth-promo__dots">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`auth-promo__dot${i === active ? " auth-promo__dot--active" : ""}`}
                onClick={() => setActive(i)}
                aria-label={`Karta ${i + 1}`}
              />
            ))}
          </div>
        </aside>

        <main className="auth-panel">
          <div className="auth-panel__inner">{children}</div>
        </main>
      </div>

      <footer className="auth-footer">moneta · aplikacja do śledzenia wydatków</footer>
    </div>
  );
}
