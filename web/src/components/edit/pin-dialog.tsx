"use client";

import { useState } from "react";

import styles from "./edit-mode.module.css";

/**
 * Vstup do editačního režimu.
 *
 * PIN se posílá na server, prohlížeč si ho nikam neukládá. Chybová hláška
 * chodí ze serveru tak, jak je - rozlišuje jen "špatný PIN" a "moc pokusů".
 */

type PinDialogProps = {
  readonly onUnlocked: () => void;
  readonly onCancel: () => void;
};

export function PinDialog({ onUnlocked, onCancel }: PinDialogProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (sending || pin.length === 0) return;

    setSending(true);
    setError(null);

    try {
      const response = await fetch("/api/edit/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      if (response.ok) {
        setPin("");
        onUnlocked();
        return;
      }

      const body: unknown = await response.json().catch(() => null);
      const message =
        typeof body === "object" && body !== null && "error" in body
          ? String((body as { error: unknown }).error)
          : "";
      setError(message || "Přihlášení se nepovedlo.");
    } catch {
      setError("Server neodpověděl.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className={styles.overlay}
      onKeyDown={(event) => {
        if (event.key === "Escape") onCancel();
      }}
    >
      <form className={styles.dialog} onSubmit={submit}>
        <h2 className={styles.dialogTitle}>Úprava textů</h2>
        <p className={styles.dialogNote}>Zadejte PIN a otevře se panel.</p>

        <input
          className={styles.input}
          type="password"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          value={pin}
          placeholder="PIN"
          aria-label="PIN"
          onChange={(event) => setPin(event.target.value)}
        />

        {error ? <p className={styles.error}>{error}</p> : null}

        <div className={styles.dialogActions}>
          <button
            type="button"
            className={`${styles.button} ${styles.buttonGhost}`}
            onClick={onCancel}
          >
            Zrušit
          </button>
          <button className={styles.button} type="submit" disabled={sending}>
            {sending ? "Ověřuji…" : "Otevřít"}
          </button>
        </div>
      </form>
    </div>
  );
}
