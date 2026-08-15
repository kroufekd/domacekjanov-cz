"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { defaultLocale, isLocale, type Locale } from "@/i18n/config";

import { EditWorkbench } from "./edit-workbench";
import { PinDialog } from "./pin-dialog";

/**
 * Přepínač mezi PINem a dílnou.
 *
 * Načte se až po `?edit` v adrese, takže běžný návštěvník si ho nikdy
 * nestáhne. Vypnutý režim (chybí PIN nebo zápisový token) odpoví 404 a
 * komponenta se tiše vypne - na stránce se nic neobjeví.
 */

type EditModeProps = {
  readonly onExit: () => void;
};

type Phase = "checking" | "locked" | "open" | "off";

/** Jazyk podle adresy: `/de` a `/en`, čeština je na kořeni. */
function localeFromPathname(pathname: string): Locale {
  const [, first] = pathname.split("/");
  return isLocale(first) ? first : defaultLocale;
}

export function EditMode({ onExit }: EditModeProps) {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("checking");

  useEffect(() => {
    let live = true;

    fetch("/api/edit/session", { cache: "no-store" })
      .then(async (response) => {
        if (!live) return;
        if (response.status === 404) {
          setPhase("off");
          return;
        }
        const body = (await response.json()) as { active?: boolean };
        setPhase(body.active ? "open" : "locked");
      })
      .catch(() => {
        if (live) setPhase("off");
      });

    return () => {
      live = false;
    };
  }, []);

  const handleSignedOut = useCallback(() => setPhase("locked"), []);

  if (phase === "checking" || phase === "off") return null;

  if (phase === "locked") {
    return <PinDialog onUnlocked={() => setPhase("open")} onCancel={onExit} />;
  }

  return (
    <EditWorkbench
      locale={localeFromPathname(pathname)}
      previewPath={pathname}
      onExit={onExit}
      onSignedOut={handleSignedOut}
    />
  );
}
