"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";

/**
 * Vstupní bod editačního režimu.
 *
 * Sedí v layoutu, ale dokud v adrese není `?edit`, nevykreslí nic a nic
 * nestáhne - stránka tak zůstává staticky předgenerovaná a návštěvník o
 * panelu neví. Samotný panel se dotahuje až na vyžádání.
 */

const EditMode = dynamic(
  () => import("./edit-mode").then((module) => module.EditMode),
  { ssr: false },
);

const EDIT_PARAM = "edit";

export function EditMount() {
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    const read = () =>
      setRequested(
        new URLSearchParams(window.location.search).has(EDIT_PARAM),
      );

    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, []);

  /** Zavření panelu jen odstraní `?edit`, stránka pod ním zůstává. */
  const exit = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete(EDIT_PARAM);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    setRequested(false);
  }, []);

  return requested ? <EditMode onExit={exit} /> : null;
}
