"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Native <dialog> gives focus trapping, Esc to close and the top layer for free.
// No close() in the effect cleanup: StrictMode runs cleanup once on mount, and the
// queued "close" event would dismiss the dialog immediately.
export function Modal({
  children,
  className = "",
  label,
  onClose,
}: {
  children: ReactNode;
  className?: string;
  label: string;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
  }, []);

  return (
    <dialog
      aria-label={label}
      className={`modal ${className}`}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onClose={onClose}
      ref={dialog}
    >
      {children}
    </dialog>
  );
}
