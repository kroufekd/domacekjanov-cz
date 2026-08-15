"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { Locale } from "@/i18n/config";
import type { EditableField, EditableGroup } from "@/lib/edit/fields";

import { EditField } from "./edit-field";
import type { Preview } from "./preview";
import styles from "./edit-mode.module.css";

/**
 * Panel s texty webu.
 *
 * Rozdělaná změna žije jen tady a rovnou se promítá do rámu vedle, takže
 * klient vidí výsledek dřív, než se rozhodne uložit. Do CMS jde až na tlačítko.
 */

type EditPanelProps = {
  readonly locale: Locale;
  readonly preview: Preview;
  readonly onSaved: () => void;
  readonly onExit: () => void;
  readonly onSignedOut: () => void;
};

type Draft = Readonly<Record<string, string>>;

type Feedback = {
  readonly message: string;
  readonly kind: "info" | "error";
};

type LoadState =
  | { readonly status: "loading" }
  | { readonly status: "failed"; readonly message: string }
  | { readonly status: "ready"; readonly groups: readonly EditableGroup[] };

const matchesQuery = (field: EditableField, query: string): boolean =>
  `${field.label} ${field.value}`.toLowerCase().includes(query);

async function readError(response: Response, fallback: string) {
  const body: unknown = await response.json().catch(() => null);
  const message =
    typeof body === "object" && body !== null && "error" in body
      ? String((body as { error: unknown }).error)
      : "";
  return message || fallback;
}

export function EditPanel({
  locale,
  preview,
  onSaved,
  onExit,
  onSignedOut,
}: EditPanelProps) {
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [draft, setDraft] = useState<Draft>({});
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    let live = true;

    fetch(`/api/edit/fields?locale=${locale}`, { cache: "no-store" })
      .then(async (response) => {
        if (!live) return;
        if (response.status === 401) {
          onSignedOut();
          return;
        }
        if (!response.ok) {
          setLoad({
            status: "failed",
            message: await readError(response, "Texty se nepodařilo načíst."),
          });
          return;
        }
        const body = (await response.json()) as { groups: EditableGroup[] };
        setLoad({ status: "ready", groups: body.groups });
      })
      .catch(() => {
        if (live) {
          setLoad({ status: "failed", message: "Server neodpověděl." });
        }
      });

    return () => {
      live = false;
    };
  }, [locale, onSignedOut]);

  const changedKeys = useMemo(() => Object.keys(draft), [draft]);

  useEffect(() => {
    if (changedKeys.length === 0) return undefined;

    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [changedKeys.length]);

  const fields = useMemo(
    () =>
      load.status === "ready" ? load.groups.flatMap((group) => group.fields) : [],
    [load],
  );

  const handleChange = useCallback(
    (field: EditableField, value: string) => {
      setDraft((current) => ({ ...current, [field.key]: value }));
      setFeedback(null);
      preview.apply(field, value);
    },
    [preview],
  );

  const discard = useCallback(() => {
    fields
      .filter((field) => field.key in draft)
      .forEach((field) => preview.reset(field));
    setDraft({});
    setFeedback(null);
  }, [draft, fields, preview]);

  const applySaved = useCallback((saved: Draft) => {
    setLoad((current) =>
      current.status === "ready"
        ? {
            status: "ready",
            groups: current.groups.map((group) => ({
              ...group,
              fields: group.fields.map((field) =>
                field.key in saved
                  ? { ...field, value: saved[field.key] }
                  : field,
              ),
            })),
          }
        : current,
    );
  }, []);

  const save = useCallback(async () => {
    const changes = Object.entries(draft).map(([key, value]) => ({
      key,
      value,
    }));
    if (changes.length === 0) return;

    setSaving(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/edit/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, changes }),
      });

      if (response.status === 401) {
        onSignedOut();
        return;
      }

      if (!response.ok) {
        setFeedback({
          kind: "error",
          message: await readError(response, "Uložení se nepovedlo."),
        });
        return;
      }

      const body = (await response.json()) as { values?: Draft };
      applySaved(body.values ?? draft);
      setDraft({});
      setFeedback({ kind: "info", message: "Uloženo." });
      onSaved();
    } catch {
      setFeedback({ kind: "error", message: "Server neodpověděl." });
    } finally {
      setSaving(false);
    }
  }, [applySaved, draft, locale, onSaved, onSignedOut]);

  const signOut = useCallback(async () => {
    await fetch("/api/edit/logout", { method: "POST" }).catch(() => null);
    onSignedOut();
  }, [onSignedOut]);

  const needle = query.trim().toLowerCase();
  const groups =
    load.status === "ready"
      ? load.groups
          .map((group) => ({
            ...group,
            fields: needle
              ? group.fields.filter((field) => matchesQuery(field, needle))
              : group.fields,
          }))
          .filter((group) => group.fields.length > 0)
      : [];

  const status = feedback
    ? feedback.message
    : changedKeys.length > 0
      ? `Neuloženo: ${changedKeys.length}`
      : "Vše uloženo";

  return (
    <section className={styles.panel} aria-label="Úprava textů">
      <header className={styles.header}>
        <h2 className={styles.title}>Úprava textů</h2>
        <span className={styles.badge}>{locale}</span>
        <button type="button" className={styles.iconButton} onClick={signOut}>
          Odhlásit
        </button>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onExit}
          aria-label="Zavřít panel"
        >
          Zavřít
        </button>
      </header>

      <div className={styles.search}>
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Hledat v textech…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className={styles.body}>
        {load.status === "loading" ? (
          <p className={styles.empty}>Načítám texty…</p>
        ) : null}

        {load.status === "failed" ? (
          <p className={`${styles.empty} ${styles.statusError}`}>
            {load.message}
          </p>
        ) : null}

        {load.status === "ready" && groups.length === 0 ? (
          <p className={styles.empty}>Nic takového tu není.</p>
        ) : null}

        {groups.map((group, index) => (
          <details
            key={group.id}
            className={styles.group}
            open={index === 0 || needle.length > 0}
          >
            <summary className={styles.groupSummary}>
              {group.title}
              <span className={styles.groupCount}>{group.fields.length}</span>
            </summary>
            {group.fields.map((field) => (
              <EditField
                key={field.key}
                field={field}
                value={draft[field.key] ?? field.value}
                changed={field.key in draft}
                onChange={handleChange}
                onFocus={preview.highlight}
                onBlur={preview.clearHighlight}
              />
            ))}
          </details>
        ))}
      </div>

      <footer className={styles.footer}>
        <span
          className={`${styles.status} ${
            feedback?.kind === "error" ? styles.statusError : ""
          }`}
          role="status"
        >
          {status}
        </span>
        <button
          type="button"
          className={`${styles.button} ${styles.buttonGhost}`}
          onClick={discard}
          disabled={saving || changedKeys.length === 0}
        >
          Zahodit
        </button>
        <button
          type="button"
          className={styles.button}
          onClick={save}
          disabled={saving || changedKeys.length === 0}
        >
          {saving ? "Ukládám…" : "Uložit"}
        </button>
      </footer>
    </section>
  );
}
