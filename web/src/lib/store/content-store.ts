import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import seed from "@/data/content-seed.json";
import { contentFile, historyDir } from "@/lib/store/paths";

/**
 * Obsah webu na disku.
 *
 * Tvar souboru kopíruje původní dokumenty CMS - texty
 * jsou objekty `{cs, de, en}`, seznamy zůstávají seznamy. Díky tomu se
 * normalizace i mapování editovatelných polí nemusely měnit; vyměnil se jen
 * přenos, ne data.
 *
 * Zápis jde přes dočasný soubor a přejmenování. Kdyby proces spadl uprostřed,
 * na disku zůstane celá předchozí verze, ne půlka nové.
 */

export type ContentStore = {
  readonly siteSettings: unknown;
  readonly siteCopy: unknown;
  readonly accommodation: unknown;
  readonly rates: readonly unknown[];
  readonly gallery: readonly unknown[];
  readonly trips: readonly unknown[];
};

const SECTIONS = [
  "siteSettings",
  "siteCopy",
  "accommodation",
  "rates",
  "gallery",
  "trips",
] as const;

/** Výchozí obsah - přesně to, co bylo na webu v den přechodu na svazek. */
export const seedStore = (): ContentStore => structuredClone(seed) as ContentStore;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Uzná jen soubor, který má všechny sekce. Poloprázdný obsah by se na webu
 * projevil jako zmizelé sekce, a to je horší než sáhnout po výchozím znění.
 */
export function isContentStore(value: unknown): value is ContentStore {
  if (!isRecord(value)) return false;

  return SECTIONS.every((section) => {
    const part = value[section];
    const wantsList = section === "rates" || section === "gallery" || section === "trips";
    return wantsList ? Array.isArray(part) : isRecord(part);
  });
}

type Cached = { readonly store: ContentStore; readonly loadedAt: number };

let cache: Cached | null = null;

/** Soubor se nečte při každém požadavku, ale ani se nedrží věčně. */
const CACHE_MS = 2_000;

export function forgetCachedStore(): void {
  cache = null;
}

/**
 * Načte obsah. Chybějící nebo poškozený soubor není chyba - web pojede z
 * výchozího obsahu a první uložení soubor založí.
 */
export async function readStore(): Promise<ContentStore> {
  const fresh = cache && Date.now() - cache.loadedAt < CACHE_MS;
  if (cache && fresh) return cache.store;

  try {
    const raw = await readFile(contentFile(), "utf8");
    const parsed: unknown = JSON.parse(raw);

    if (!isContentStore(parsed)) {
      console.error("Obsah na disku nemá očekávaný tvar, beru výchozí.");
      return seedStore();
    }

    cache = { store: parsed, loadedAt: Date.now() };
    return parsed;
  } catch (error) {
    const missing =
      isRecord(error) && (error as { code?: string }).code === "ENOENT";

    if (!missing) {
      console.error("Obsah na disku se nepovedlo přečíst, beru výchozí.", error);
    }

    return seedStore();
  }
}

/** Uloží obsah a odloží kopii předchozí verze do historie. */
export async function writeStore(store: ContentStore): Promise<void> {
  if (!isContentStore(store)) {
    throw new Error("Odmítám uložit obsah, kterému chybí sekce.");
  }

  const target = contentFile();
  await mkdir(path.dirname(target), { recursive: true });

  const temporary = `${target}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  await rename(temporary, target);

  cache = { store, loadedAt: Date.now() };
}

/**
 * Odloží současnou verzi stranou, než se přepíše. Selhání zálohy nesmí shodit
 * ukládání - bez ní se text uloží, jen se hůř vrací.
 */
export async function archiveStore(stamp: string): Promise<void> {
  try {
    const current = await readFile(contentFile(), "utf8");
    const folder = historyDir();
    await mkdir(folder, { recursive: true });
    await writeFile(path.join(folder, `content-${stamp}.json`), current, "utf8");
  } catch (error) {
    const missing =
      isRecord(error) && (error as { code?: string }).code === "ENOENT";
    if (!missing) {
      console.error("Zálohu obsahu se nepovedlo odložit.", error);
    }
  }
}

/**
 * Čtení a zápis jsou dva kroky, takže dvě souběžné úpravy by si mohly přepsat
 * výsledek. Na jednom kontejneru stačí je poskládat za sebe - texty i fotky
 * sdílejí jednu frontu, protože sahají do stejného souboru.
 */
let queue: Promise<unknown> = Promise.resolve();

export type StoreChange =
  | { readonly store: ContentStore }
  | { readonly error: string };

/** Načte obsah, nechá ho upravit a uloží. Chybu z úpravy jen propustí dál. */
export function updateStore(
  mutate: (store: ContentStore) => StoreChange | Promise<StoreChange>,
): Promise<{ readonly error?: string }> {
  const task = async () => {
    const current = await readStore();
    const outcome = await mutate(current);

    if ("error" in outcome) return { error: outcome.error };

    await archiveStore(new Date().toISOString().replace(/[:.]/g, "-"));
    await writeStore(outcome.store);
    return {};
  };

  const next = queue.then(task, task);
  queue = next.catch(() => undefined);
  return next;
}
