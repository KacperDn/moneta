import { KeyboardEvent, ReactNode, useEffect, useRef, useState } from "react";

interface DialogShellProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Modal frame shared by the edit dialogs: overlay, title, click-outside and Escape to close.
 * Keeps keyboard focus inside while open and hands it back to the opener on close.
 */
export default function DialogShell({ title, onClose, children }: DialogShellProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  // Read on the first render, before a child with autoFocus takes focus in the commit phase.
  const [opener] = useState(() => document.activeElement as HTMLElement | null);

  useEffect(() => {
    // An element with autoFocus has already taken focus; otherwise focus the dialog itself.
    if (!boxRef.current?.contains(document.activeElement)) boxRef.current?.focus();
    return () => { if (opener?.isConnected) opener.focus(); };
  }, [opener]);

  useEffect(() => {
    const onKeyDown = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const trapTab = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !boxRef.current) return;
    const focusable = boxRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === boxRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="confirm__overlay" onClick={onClose}>
      <div
        ref={boxRef}
        className="edit__box"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        onKeyDown={trapTab}
      >
        <div className="edit__title">{title}</div>
        {children}
      </div>
    </div>
  );
}
