"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { localeMeta, locales, type Locale } from "@/i18n/config";
import type { EditableField, EditableGroup } from "@/lib/edit/fields";

import { EditField } from "./edit-field";
import { EditPhotos } from "./edit-photos";
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
 *
 * Jazyk určuje rám, takže se pod rukama mění. Klíče polí jsou pro všechny
 * jazyky stejné, proto se rozdělané změny drží zvlášť po jazycích - jinak by
 * se český text uložil jako německý.
 */

type EditPanelProps = {
  /** Jazyk stránky v rámu; přepnutí jazyka načte panel znovu. */
  readonly locale: Locale;
  readonly bridge: FrameBridge;
  /** Roste s každým načtením rámu; napojení textů se musí udělat znovu. */
  readonly frameEpoch: number;
  readonly onSaved: () => void;
  readonly onExit: () => void;
  readonly onSignedOut: () => void;
};

type Draft = Readonly<Record<string, string>>;

/** Rozdělané změny po jazycích. Co se nestihlo uložit, čeká na návrat. */
type Drafts = Readonly<Partial<Record<Locale, Draft>>>;

const EMPTY_DRAFT: Draft = {};

const countChanges = (draft: Draft | undefined): number =>
  Object.keys(draft ?? EMPTY_DRAFT).length;

/** Kam se panel chystá odejít, dokud čeká na potvrzení. */
type Departure = "exit" | "signOut" | null;

type Feedback = {
  readonly message: string;
  readonly kind: "info" | "error";
};

/**
 * Načtená pole nesou jazyk, ke kterému patří. Bez toho by po přepnutí jazyka
 * v rámu chvíli svítily texty toho minulého a rám by se napojil na pole, která
 * na stránce nejsou.
 */
type LoadState = { readonly locale: Locale } & (
  | { readonly status: "loading" }
  | { readonly status: "failed"; readonly message: string }
  | { readonly status: "ready"; readonly groups: readonly EditableGroup[] }
);

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
  const [loaded, setLoad] = useState<LoadState>({
    status: "loading",
    locale,
  });
  const [drafts, setDrafts] = useState<Drafts>({});
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [openGroups, setOpenGroups] = useState<Readonly<Record<string, boolean>>>(
    {},
  );
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [inlineEnabled, setInlineEnabled] = useState(true);
  const [pending, setPending] = useState<Departure>(null);
  const body = useRef<HTMLDivElement>(null);

  const draft = drafts[locale] ?? EMPTY_DRAFT;

  /** Dokud nedojdou pole nového jazyka, panel se tváří jako při načítání. */
  const load = useMemo<LoadState>(
    () => (loaded.locale === locale ? loaded : { status: "loading", locale }),
    [loaded, locale],
  );

  /** Zápis do rozdělané změny právě zobrazeného jazyka. */
  const editDraft = useCallback(
    (change: (current: Draft) => Draft) =>
      setDrafts((current) => ({
        ...current,
        [locale]: change(current[locale] ?? EMPTY_DRAFT),
      })),
    [locale],
  );

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
            locale,
            message: await readError(response, "Texty se nepodařilo načíst."),
          });
          return;
        }
        const payload = (await response.json()) as { groups: EditableGroup[] };
        setLoad({ status: "ready", locale, groups: payload.groups });

        // Na začátku je otevřená první skupina, zbytek se otevírá až podle
        // toho, kam čtenář v rámu dojede nebo na co v panelu klikne.
        const first = payload.groups[0]?.id;
        if (first) setOpenGroups({ [first]: true });
      })
      .catch(() => {
        if (live) {
          setLoad({ status: "failed", locale, message: "Server neodpověděl." });
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

  // Rozdělaná změna se do rámu vrací po jeho načtení, ne po každém písmenu -
  // proto přes ref, aby psaní nespouštělo napojení znovu.
  const draftRef = useRef(draft);
  useEffect(() => {
    draftRef.current = draft;
  });

  // Napojení na text v rámu se dělá po načtení polí a po každém načtení rámu.
  useEffect(() => {
    if (fields.length === 0) return;

    bridge.refresh(fields);

    // Rám přišel ze serveru, takže o neuložených změnách neví. U návratu k
    // jazyku, kde něco zůstalo rozdělané, se musí promítnout zpátky.
    fields
      .filter((field) => field.key in draftRef.current)
      .forEach((field) => bridge.apply(field, draftRef.current[field.key]));
  }, [bridge, fields, frameEpoch]);

  useEffect(() => {
    bridge.setInlineEnabled(inlineEnabled);
  }, [bridge, inlineEnabled]);

  const changedKeys = useMemo(() => Object.keys(draft), [draft]);

  /** Neuložené změny v jazycích, které zrovna nejsou vidět. */
  const changedElsewhere = useMemo(
    () =>
      locales
        .filter((code) => code !== locale)
        .reduce((sum, code) => sum + countChanges(drafts[code]), 0),
    [drafts, locale],
  );

  const changedTotal = changedKeys.length + changedElsewhere;

  useEffect(() => {
    if (changedTotal === 0) return undefined;

    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [changedTotal]);

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
      editDraft((current) => ({ ...current, [field.key]: value }));
      setFeedback(null);
      bridge.hold();
      bridge.apply(field, value);
    },
    [bridge, editDraft],
  );

  /** Psaní přímo do stránky i scroll rámu končí tady, u stejného draftu. */
  useEffect(() => {
    bridge.listen({
      onInlineChange: (key, value) => {
        if (!fieldByKey.has(key)) return;
        setFeedback(null);
        editDraft((current) => ({ ...current, [key]: value }));
        revealField(key);
      },
      onVisibleField: revealField,
    });
  }, [bridge, editDraft, fieldByKey, revealField]);

  /** Zahazuje jen zobrazený jazyk - o rozdělané ostatní panel nepřijde. */
  const discard = useCallback(() => {
    fields
      .filter((field) => field.key in draft)
      .forEach((field) => bridge.reset(field));
    editDraft(() => EMPTY_DRAFT);
    setFeedback(null);
  }, [bridge, draft, editDraft, fields]);

  /** Uložené hodnoty se promítnou jen do polí toho jazyka, kterému patří. */
  const applySaved = useCallback((target: Locale, saved: Draft) => {
    setLoad((current) =>
      current.status === "ready" && current.locale === target
        ? {
            status: "ready",
            locale: current.locale,
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

  /**
   * Vyřadí z rozdělané změny jen to, co server opravdu dostal. Během ukládání
   * jde dál psát a taková písmena by při plošném vyprázdnění zmizela.
   */
  const clearSaved = useCallback((code: Locale, saved: Draft) => {
    setDrafts((current) => {
      const draft = current[code] ?? EMPTY_DRAFT;
      const rest = Object.fromEntries(
        Object.entries(draft).filter(([key, value]) => saved[key] !== value),
      );

      return countChanges(draft) === countChanges(rest)
        ? current
        : { ...current, [code]: rest };
    });
  }, []);

  /**
   * Uloží rozdělané změny všech jazyků, ne jen toho zobrazeného - jinak by
   * práce v jazyce, od kterého editor mezitím odešel, tiše spadla pod stůl.
   *
   * Vrací, jestli se uložilo - podle toho se pozná, že jde zavřít.
   */
  const save = useCallback(async (): Promise<boolean> => {
    const batches = locales
      .map((code) => ({
        locale: code,
        changes: Object.entries(drafts[code] ?? EMPTY_DRAFT).map(
          ([key, value]) => ({ key, value }),
        ),
      }))
      .filter((batch) => batch.changes.length > 0);

    if (batches.length === 0) return true;

    setSaving(true);
    setFeedback(null);

    try {
      // Jeden jazyk po druhém: zápisy jdou do stejných dokumentů, takže by si
      // souběžné požadavky přepisovaly výsledek.
      for (const batch of batches) {
        const response = await fetch("/api/edit/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locale: batch.locale,
            changes: batch.changes,
          }),
        });

        if (response.status === 401) {
          onSignedOut();
          return false;
        }

        if (!response.ok) {
          const message = await readError(response, "Uložení se nepovedlo.");
          setFeedback({
            kind: "error",
            message:
              batch.locale === locale
                ? message
                : `${localeMeta[batch.locale].short}: ${message}`,
          });
          return false;
        }

        const payload = (await response.json()) as { values?: Draft };
        const sent: Draft = Object.fromEntries(
          batch.changes.map(({ key, value }) => [key, value]),
        );

        applySaved(batch.locale, payload.values ?? sent);
        clearSaved(batch.locale, sent);
      }

      setFeedback({ kind: "info", message: "Uloženo." });
      onSaved();
      return true;
    } catch {
      setFeedback({ kind: "error", message: "Server neodpověděl." });
      return false;
    } finally {
      setSaving(false);
    }
  }, [applySaved, clearSaved, drafts, locale, onSaved, onSignedOut]);

  const signOut = useCallback(async () => {
    await fetch("/api/edit/logout", { method: "POST" }).catch(() => null);
    onSignedOut();
  }, [onSignedOut]);

  /*
   * Odchod z panelu s rozdělanou změnou.
   *
   * `beforeunload` chytá zavření okna, ale ne tlačítka tady - klik na "Zavřít"
   * dřív rozdělanou práci tiše zahodil. Proto se místo odchodu nejdřív zeptáme.
   */
  const leave = useCallback(
    (kind: Departure) => {
      if (kind === "signOut") {
        void signOut();
      } else {
        onExit();
      }
    },
    [onExit, signOut],
  );

  const requestLeave = useCallback(
    (kind: Departure) => {
      if (changedTotal === 0) {
        leave(kind);
      } else {
        setPending(kind);
      }
    },
    [changedTotal, leave],
  );

  const saveAndLeave = useCallback(async () => {
    const kind = pending;
    if (!kind) return;

    if (await save()) leave(kind);
  }, [leave, pending, save]);

  const discardAndLeave = useCallback(() => {
    const kind = pending;
    if (!kind) return;

    discard();
    setDrafts({});
    setPending(null);
    leave(kind);
  }, [discard, leave, pending]);

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
      : changedElsewhere > 0
        ? `Neuloženo v jiném jazyce: ${changedElsewhere}`
        : "Vše uloženo";

  return (
    <section className={styles.panel} aria-label="Úprava textů">
      <header className={styles.header}>
        <h2 className={styles.title}>Úprava textů</h2>
        <span className={styles.badge} title={localeMeta[locale].nativeName}>
          {localeMeta[locale].short}
        </span>
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => requestLeave("signOut")}
        >
          Odhlásit
        </button>
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => requestLeave("exit")}
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

        {load.status === "ready" ? (
          <details
            className={styles.group}
            open={openGroups.fotky ?? false}
            onToggle={(event) => {
              const open = (event.target as HTMLDetailsElement).open;
              setOpenGroups((current) =>
                current.fotky === open ? current : { ...current, fotky: open },
              );
            }}
          >
            <summary className={styles.groupSummary}>
              Fotky
              <span className={styles.groupCount}>galerie</span>
            </summary>
            {openGroups.fotky ? (
              <EditPhotos locale={locale} onChanged={onSaved} />
            ) : null}
          </details>
        ) : null}
      </div>

      {pending ? (
        <div className={styles.confirm} role="alertdialog" aria-live="assertive">
          <p className={styles.confirmText}>
            {changedTotal === 1
              ? "Jedna změna není uložená."
              : `Neuložených změn: ${changedTotal}.`}{" "}
            {pending === "signOut" ? "Opravdu se odhlásit?" : "Opravdu zavřít?"}
          </p>
          <div className={styles.confirmActions}>
            <button
              type="button"
              className={styles.button}
              onClick={saveAndLeave}
              disabled={saving}
            >
              {saving ? "Ukládám…" : "Uložit a zavřít"}
            </button>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonGhost}`}
              onClick={discardAndLeave}
              disabled={saving}
            >
              Zahodit
            </button>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonGhost}`}
              onClick={() => setPending(null)}
              disabled={saving}
            >
              Zpět
            </button>
          </div>
        </div>
      ) : null}

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
          disabled={saving || changedTotal === 0}
        >
          {saving ? "Ukládám…" : "Uložit"}
        </button>
      </footer>
    </section>
  );
}
