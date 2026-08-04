import { ReactNode, useEffect, useState } from "react";

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const IconPieChart = (
  <svg {...iconProps}>
    <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
    <path d="M22 12A10 10 0 0 0 12 2v10z" />
  </svg>
);

const IconTrendingUp = (
  <svg {...iconProps}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const IconCloud = (
  <svg {...iconProps}>
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
  </svg>
);

const IconShield = (
  <svg {...iconProps}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

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

  useEffect(() => {
    const id = setTimeout(() => setActive(a => (a + 1) % SLIDES.length), 5000);
    return () => clearTimeout(id);
  }, [active]);

  const next = () => setActive(a => (a + 1) % SLIDES.length);

  return (
    <div className="auth-shell">
      <div className="auth-glow auth-glow--1" />
      <div className="auth-glow auth-glow--2" />

      <header className="auth-header">
        <span className="auth-header__logo">moneta</span>
      </header>

      <div className="auth-scene">
        <aside className="auth-promo">
          <div className="auth-stack">
            {SLIDES.map((s, i) => {
              const pos = (i - active + SLIDES.length) % SLIDES.length;
              const hidden = pos === SLIDES.length - 1;
              return (
                <button
                  key={i}
                  type="button"
                  className={`auth-stack__card auth-stack__card--pos${pos}`}
                  onClick={next}
                  tabIndex={hidden ? -1 : 0}
                  aria-hidden={hidden}
                >
                  <div className="auth-stack__icon">{s.icon}</div>
                  <div className="auth-stack__title">{s.title}</div>
                  <div className="auth-stack__desc">{s.desc}</div>
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
