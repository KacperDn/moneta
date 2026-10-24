import { useTranslation } from "react-i18next";
import { revealProps } from "../hooks/useScrollReveal";

const CATEGORIES = [
  { key: "Jedzenie", pct: 42, color: "#f97316" },
  { key: "Rachunki", pct: 27, color: "#ef4444" },
  { key: "Transport", pct: 18, color: "#3b82f6" },
  { key: "Rozrywka", pct: 13, color: "#a855f7" },
];
const BARS = [38, 62, 45, 80, 55, 92, 70, 48, 66, 85, 58, 74];

/** Decorative preview of the dashboard (landing hero, auth screens). Static data, hidden from assistive tech. */
export default function DashboardMock() {
  const { t } = useTranslation();
  return (
    <div className="mock" aria-hidden="true" {...revealProps()}>
      <div className="mock__window">
        <div className="mock__head">
          <div>
            <div className="mock__label">{t("landing.mockLabel")}</div>
            <div className="mock__total">3 482,50<span>zł</span></div>
          </div>
          <div className="mock__donut"><div className="mock__donut-fill" /></div>
        </div>
        <div className="mock__budget"><div className="mock__budget-fill" /></div>
        <div className="mock__bars">
          {BARS.map((h, i) => (
            <span key={i} style={{ height: `${h}%`, transitionDelay: `${300 + i * 45}ms` }} />
          ))}
        </div>
        <div className="mock__rows">
          {CATEGORIES.map(c => (
            <div className="mock__row" key={c.key}>
              <span className="mock__dot" style={{ background: c.color }} />
              <span className="mock__name">{t(`categories.${c.key}`, { defaultValue: c.key })}</span>
              <span className="mock__pct">{c.pct}%</span>
              <div className="mock__track"><div style={{ width: `${c.pct}%`, background: c.color }} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
