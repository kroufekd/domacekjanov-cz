"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

import type { Dictionary } from "@/i18n/dictionary";

type ModalProps = {
  open: boolean;
  title: string;
  labels: Dictionary["dialog"];
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
};

export function Modal({
  open,
  title,
  labels,
  onClose,
  children,
  wide = false,
}: ModalProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="modal-layer" role="presentation">
      <button
        type="button"
        className="modal-layer__backdrop"
        aria-label={labels.closeDialog}
        onClick={onClose}
      />
      <section
        className={`modal-panel ${wide ? "modal-panel--wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-panel__header">
          <h2 id="modal-title">{title}</h2>
          <button
            ref={closeRef}
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label={labels.close}
          >
            <X aria-hidden="true" />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
