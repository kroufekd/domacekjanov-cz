import type { Locale } from "@/i18n/config";
import { applyFieldChange, type SanityDocument } from "@/lib/edit/document-update";
import {
  ACCOMMODATION_ID,
  isWritableDocumentId,
  SITE_COPY_ID,
  SITE_SETTINGS_ID,
  type EditableField,
} from "@/lib/edit/fields";
import { failed } from "@/lib/edit/patch";
import {
  archiveStore,
  readStore,
  writeStore,
  type ContentStore,
} from "@/lib/store/content-store";

/**
 * Uložení dávky úprav do obsahu na disku.
 *
 * Panel pořád mluví o dokumentech (`siteCopy-main`, `rate-summer`) - je to
 * tvar, který zbyl po Sanity a nemá smysl ho přejmenovávat, protože přesně
 * odpovídá sekcím v souboru. Tady se jen přeloží na místo v `content.json`.
 *
 * Zápis je jedna operace: buď se uloží celá dávka, nebo nic. Soubor se čte
 * těsně před zápisem, takže se do něj promítne i to, co uložil někdo jiný.
 */

export type ResolvedChange = {
  readonly field: EditableField;
  readonly value: string;
};

export type SaveOutcome =
  | { readonly saved: number }
  | { readonly error: string; readonly status: number };

const makeKey = (): string =>
  `k${Math.floor(Date.now() % 1_000_000).toString(36)}${Math.floor(
    performance.now() * 1000,
  ).toString(36)}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Čtení a zápis jsou dva kroky, takže dvě souběžná uložení by si mohla
 * přepsat výsledek. Na jednom kontejneru stačí je poskládat za sebe.
 */
let queue: Promise<unknown> = Promise.resolve();

const serialize = <T,>(task: () => Promise<T>): Promise<T> => {
  const next = queue.then(task, task);
  queue = next.catch(() => undefined);
  return next;
};

type Lens = {
  readonly read: (store: ContentStore) => unknown;
  readonly write: (store: ContentStore, value: SanityDocument) => ContentStore;
};

/** Kde v souboru daný "dokument" leží. */
function lensFor(documentId: string): Lens | null {
  if (documentId === SITE_SETTINGS_ID) {
    return {
      read: (store) => store.siteSettings,
      write: (store, value) => ({ ...store, siteSettings: value }),
    };
  }

  if (documentId === SITE_COPY_ID) {
    return {
      read: (store) => store.siteCopy,
      write: (store, value) => ({ ...store, siteCopy: value }),
    };
  }

  if (documentId === ACCOMMODATION_ID) {
    return {
      read: (store) => store.accommodation,
      write: (store, value) => ({ ...store, accommodation: value }),
    };
  }

  if (!isWritableDocumentId(documentId)) return null;

  return {
    read: (store) =>
      store.rates.find(
        (rate) => isRecord(rate) && rate.id === documentId,
      ),
    write: (store, value) => ({
      ...store,
      rates: store.rates.map((rate) =>
        isRecord(rate) && rate.id === documentId ? value : rate,
      ),
    }),
  };
}

function applyAll(
  store: ContentStore,
  locale: Locale,
  changes: readonly ResolvedChange[],
): { readonly store: ContentStore } | { readonly error: string } {
  let next = store;

  for (const change of changes) {
    const lens = lensFor(change.field.documentId);
    if (!lens) {
      return { error: `Dokument "${change.field.documentId}" upravovat nelze.` };
    }

    const target = lens.read(next);
    if (!isRecord(target)) {
      return { error: `${change.field.label}: v obsahu chybí místo pro zápis.` };
    }

    const outcome = applyFieldChange(
      target,
      change.field,
      locale,
      change.value,
      makeKey,
    );
    if (failed(outcome)) return { error: outcome.error };

    next = lens.write(next, outcome.value);
  }

  return { store: next };
}

/** Uloží změny a vrátí, kolik polí se zapsalo. */
export function saveChanges(
  locale: Locale,
  changes: readonly ResolvedChange[],
): Promise<SaveOutcome> {
  return serialize(async () => {
    try {
      const store = await readStore();
      const result = applyAll(store, locale, changes);

      if ("error" in result) {
        return { error: result.error, status: 400 };
      }

      await archiveStore(new Date().toISOString().replace(/[:.]/g, "-"));
      await writeStore(result.store);

      return { saved: changes.length };
    } catch (error) {
      console.error("Editační režim: zápis obsahu selhal.", error);
      return { error: "Uložení se nepovedlo.", status: 502 };
    }
  });
}
