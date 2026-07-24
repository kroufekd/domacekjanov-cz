"use client";

import { ArrowUpRight, CalendarDays } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { Modal } from "@/components/modal";

type AvailabilityProps = {
  calendarUrl: string;
};

export function Availability({ calendarUrl }: AvailabilityProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const close = useCallback(() => {
    setOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }, []);

  return (
    <>
      <button
        ref={triggerRef}
        className="button button--primary"
        type="button"
        onClick={() => setOpen(true)}
      >
        <CalendarDays aria-hidden="true" size={18} />
        Zkontrolovat obsazenost
      </button>
      <Modal open={open} onClose={close} title="Volné termíny" wide>
        <div className="calendar-frame">
          <iframe
            title="Kalendář obsazenosti Domečku Janov"
            src={calendarUrl}
            loading="lazy"
          />
        </div>
        <div className="modal-panel__footer">
          <p>Kalendář spravujeme přes e‑chalupy a průběžně jej aktualizujeme.</p>
          <a href={calendarUrl} target="_blank" rel="noreferrer">
            Otevřít v nové kartě
            <ArrowUpRight aria-hidden="true" size={17} />
          </a>
        </div>
      </Modal>
    </>
  );
}
