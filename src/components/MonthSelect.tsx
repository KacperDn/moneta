import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { IconChevronDown } from "../icons";

interface MonthSelectProps {
  months: string[];
  value: number;
  onChange: (month: number) => void;
  label: string;
}

/** Styled replacement for a native <select>, so the month picker matches the rest of the UI. */
export default function MonthSelect({ months, value, onChange, label }: MonthSelectProps) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(value);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  const toggle = () => {
    setFocused(value);
    setOpen(o => !o);
  };

  const select = (month: number) => {
    onChange(month);
    setOpen(false);
  };

  const onListKeyDown = (e: KeyboardEvent) => {
    const last = months.length - 1;
    const moves: Record<string, number> = {
      ArrowDown: Math.min(focused + 2, last),
      ArrowUp: Math.max(focused - 2, 0),
      ArrowRight: Math.min(focused + 1, last),
      ArrowLeft: Math.max(focused - 1, 0),
      Home: 0,
      End: last,
    };
    if (e.key in moves) {
      e.preventDefault();
      setFocused(moves[e.key]);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      select(focused);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="month-select" ref={rootRef}>
      <button
        type="button"
        className="month-select__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={toggle}
      >
        <span>{months[value]}</span>
        <span className={`month-select__chevron${open ? " month-select__chevron--open" : ""}`}>{IconChevronDown}</span>
      </button>

      {open && (
        <ul
          ref={listRef}
          className="month-select__list"
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={`month-option-${focused}`}
          onKeyDown={onListKeyDown}
        >
          {months.map((name, i) => (
            <li
              key={i}
              id={`month-option-${i}`}
              role="option"
              aria-selected={i === value}
              className={
                "month-select__option" +
                (i === value ? " month-select__option--selected" : "") +
                (i === focused ? " month-select__option--focused" : "")
              }
              onClick={() => select(i)}
              onMouseEnter={() => setFocused(i)}
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
