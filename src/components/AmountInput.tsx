import { sanitizeAmount, formatAmount } from "../utils/amount";

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  step?: number;
  quickAmounts?: number[];
  autoFocus?: boolean;
}

/** Amount field with its own stepper buttons instead of the browser's number spinner. */
export default function AmountInput({ value, onChange, placeholder, step = 1, quickAmounts = [], autoFocus }: AmountInputProps) {
  const current = parseFloat(value) || 0;

  return (
    <div className="amount">
      <div className="amount__row">
        <button type="button" className="amount__btn" onClick={() => onChange(formatAmount(current - step))} aria-label={`-${step}`}>−</button>
        <input
          className="form__input amount__input"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder={placeholder}
          value={value}
          autoFocus={autoFocus}
          onChange={e => onChange(sanitizeAmount(e.target.value))}
        />
        <button type="button" className="amount__btn" onClick={() => onChange(formatAmount(current + step))} aria-label={`+${step}`}>+</button>
      </div>
      {quickAmounts.length > 0 && (
        <div className="amount__chips">
          {quickAmounts.map(n => (
            <button key={n} type="button" className="amount__chip" onClick={() => onChange(formatAmount(current + n))}>+{n}</button>
          ))}
        </div>
      )}
    </div>
  );
}
