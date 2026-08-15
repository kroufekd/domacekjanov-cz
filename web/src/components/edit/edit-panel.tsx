"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { Locale } from "@/i18n/config";
import type { EditableField, EditableGroup } from "@/lib/edit/fields";

import { EditField } from "./edit-field";
import type { FrameBridge } from "./frame-bridge";
import styles from "./edit-mode.module.css";

/**
 * Panel s texty webu.
 *
 * Drží rozdělanou změnu, ať přišla z políčka tady nebo z psaní přímo do
 * stránky vedle. Obojí je pořád jedna a ta samá hodnota - do CMS jde až na
 * tlačítko.
 *
 * Scroll rámu panel posouvá na pole, které je v náhledu zrovna vidět. Po
 * zásahu z panelu je synchronizace chvíli zticha, jinak by se obě strany
 * přetahovaly.
 */

type EditPanelProps = {
  readonly locale: Locale;
  readonly bridge: FrameBridge;
  /** Roste s každým načtením rámu; napojení textů se musí udělat znovu. */
  readonly frameEpoch: number;
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
  bridge,
  frameEpoch,
  onSaved,
  onExit,
  onSignedOut,
}: EditPanelProps) {
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [draft, setDraft] = useState<Draft>({});
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [openGroups, setOpenGroups] = useState<Readonly<Record<string, boolean>>>(
    {},
  );
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [inlineEnabled, setInlineEnabled] = useState(true);
  const body = useRef<HTMLDivElement>(null);

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
        const payload = (await response.json()) as { groups: EditableGroup[] };
        setLoad({ status: "ready", groups: payload.groups });

        // Na začátku je otevřená první skupina, zbytek se otevírá až podle
        // toho, kam čtenář v rámu dojede nebo na co v panelu klikne.
        const first = payload.groups[0]?.id;
        if (first) setOpenGroups({ [first]: true });
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

  const fields = useMemo(
    () =>
      load.status === "ready"
        ? load.groups.flatMap((group) => group.fields)
        : [],
    [load],
  );

  const groupOfField = useMemo(() => {
    const pairs =
      load.status === "ready"
        ? load.groups.flatMap((group) =>
            group.fields.map((field) => [field.key, group.id] as const),
          )
        : [];

    return new Map(pairs);
  }, [load]);

  const fieldByKey = useMemo(
    () => new Map(fields.map((field) => [field.key, field])),
    [fields],
  );

  // Napojení na text v rámu se dělá po načtení polí a po každém načtení rámu.
  useEffect(() => {
    if (fields.length > 0) bridge.refresh(fields);
  }, [bridge, fields, frameEpoch]);

  useEffect(() => {
    bridge.setInlineEnabled(inlineEnabled);
  }, [bridge, inlineEnabled]);

  const changedKeys = useMemo(() => Object.keys(draft), [draft]);

  useEffect(() => {
    if (changedKeys.length === 0) return undefined;

    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [changedKeys.length]);

  /** Otevře skupinu a odscrolluje panel na pole, ať už kliknutím nebo scrollem. */
  const revealField = useCallback(
    (key: string) => {
      const group = groupOfField.get(key);
      if (group) setOpenGroups((current) => ({ ...current, [group]: true }));
      setActiveKey(key);
    },
    [groupOfField],
  );

  // Doskočení musí počkat na rozbalení skupiny, jinak se scrolluje na nic.
  useEffect(() => {
    if (!activeKey) return;

    const target = body.current?.querySelector<HTMLElement>(
      `[data-field="${CSS.escape(activeKey)}"]`,
    );
    target?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeKey, openGroups]);

  const handleChange = useCallback(
    (field: EditableField, value: string) => {
      setDraft((current) => ({ ...current, [field.key]: value }));
      setFeedback(null);
      bridge.hold();
      bridge.apply(field, value);
    },
    [bridge],
  );

  /** Psaní přímo do stránky i scroll rámu končí tady, u stejného draftu. */
  useEffect(() => {
    bridge.listen({
      onInlineChange: (key, value) => {
        if (!fieldByKey.has(key)) return;
        setFeedback(null);
        setDraft((current) => ({ ...current, [key]: value }));
        revealField(key);
      },
      onVisibleField: revealField,
    });
  }, [bridge, fieldByKey, revealField]);

  const discard = useCallback(() => {
    fields
      .filter((field) => field.key in draft)
      .forEach((field) => bridge.reset(field));
    setDraft({});
    setFeedback(null);
  }, [bridge, draft, fields]);

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

      const payload = (await response.json()) as { values?: Draft };
      applySaved(payload.values ?? draft);
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

      <div className={styles.tools}>
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Hledat v textech…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={inlineEnabled}
            onChange={(event) => setInlineEnabled(event.target.checked)}
          />
          Psát rovnou do stránky
        </label>
      </div>

      <div className={styles.body} ref={body}>
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

        {groups.map((group) => (
          <details
            key={group.id}
            className={styles.group}
            open={needle.length > 0 || (openGroups[group.id] ?? false)}
            onToggle={(event) => {
              // Při hledání jsou všechny skupiny otevřené natvrdo, uložit
              // zavření by se hned přebilo zpátky.
              if (needle.length > 0) return;

              const open = (event.target as HTMLDetailsElement).open;
              setOpenGroups((current) =>
                current[group.id] === open
                  ? current
                  : { ...current, [group.id]: open },
              );
            }}
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
                active={field.key === activeKey}
                onChange={handleChange}
                onFocus={(target) => {
                  setActiveKey(target.key);
                  bridge.focusField(target);
                }}
                onBlur={bridge.blurField}
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
