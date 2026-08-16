/**
 * Zápis jedné hodnoty do dokumentu Sanity.
 *
 * Dokument se načte, upraví se jeho kopie a pošle se zpátky. Chodit na to přes
 * `patch().set()` s hlubokou cestou by bylo kratší, ale u polí to nefunguje -
 * `set` na `comfort[0].cs` nic neudělá, když `comfort` v datasetu chybí, a
 * mlčky. Takhle je vidět, co se stalo.
 *
 * Všechno je bez mutace: vstupní dokument zůstává, jak byl.
 */

export type PathSegment =
  | { readonly kind: "key"; readonly key: string }
  | { readonly kind: "index"; readonly index: number };

/** Víc položek než tohle žádná sekce nemá; strop je proti nesmyslným cestám. */
const MAX_INDEX = 199;

const KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * Rozebere `rooms[0].title` na segmenty. Vrací `null` pro cokoli, co neodpovídá
 * očekávanému tvaru - cesta chodí z prohlížeče, takže se nesmí vejít nic jako
 * `__proto__` ani prázdný krok.
 */
export function parsePath(path: string): PathSegment[] | null {
  if (!path || path.length > 200) return null;

  const segments: PathSegment[] = [];
  let rest = path;

  while (rest.length > 0) {
    const indexMatch = rest.match(/^\[(\d{1,3})\]/);
    if (indexMatch) {
      const index = Number(indexMatch[1]);
      if (index > MAX_INDEX) return null;
      segments.push({ kind: "index", index });
      rest = rest.slice(indexMatch[0].length);
      continue;
    }

    const keyMatch = rest.match(/^\.?([A-Za-z_][A-Za-z0-9_]*)/);
    if (!keyMatch || (rest.startsWith(".") && segments.length === 0)) {
      return null;
    }

    const [, key] = keyMatch;
    if (!KEY_PATTERN.test(key) || key === "__proto__" || key === "prototype") {
      return null;
    }

    segments.push({ kind: "key", key });
    rest = rest.slice(keyMatch[0].length);
  }

  return segments.length > 0 ? segments : null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export type PatchFailure = { readonly error: string };

export type PatchOutcome<T> = { readonly value: T } | PatchFailure;

export const failed = <T>(outcome: PatchOutcome<T>): outcome is PatchFailure =>
  "error" in outcome;

/** Klíč nové položky pole. Sanity ho u položek v poli vyžaduje. */
export type KeyFactory = () => string;

type SetOptions = {
  readonly makeKey: KeyFactory;
  /** Popis místa v dokumentu pro chybovou hlášku. */
  readonly label: string;
};

/**
 * Vrátí kopii `root` s hodnotou na dané cestě. Chybějící objekty po cestě
 * vznikají, chybějící položku pole umí doplnit jen na konec - díra uprostřed
 * seznamu by v Sanity nadělala víc škody než užitku.
 */
export function setAtPath(
  root: unknown,
  segments: readonly PathSegment[],
  value: unknown,
  options: SetOptions,
): PatchOutcome<unknown> {
  const [head, ...rest] = segments;
  if (!head) return { value };

  if (head.kind === "key") {
    if (root !== undefined && !isRecord(root)) {
      return { error: `${options.label}: očekával jsem objekt.` };
    }

    const current = isRecord(root) ? root : {};
    const child = setAtPath(current[head.key], rest, value, options);
    if (failed(child)) return child;

    return { value: { ...current, [head.key]: child.value } };
  }

  if (root !== undefined && !Array.isArray(root)) {
    return { error: `${options.label}: očekával jsem seznam.` };
  }

  const current: unknown[] = Array.isArray(root) ? root : [];
  if (head.index > current.length) {
    return {
      error: `${options.label}: seznam má ${current.length} položek, chtěl jsem ${head.index + 1}.`,
    };
  }

  const isNew = head.index === current.length;
  const child = setAtPath(current[head.index], rest, value, options);
  if (failed(child)) return child;

  const item =
    isNew && isRecord(child.value) && !("_key" in child.value)
      ? { _key: options.makeKey(), ...child.value }
      : child.value;

  const next = [...current];
  next[head.index] = item;

  return { value: next };
}

/** Přečte hodnotu na cestě, nebo `undefined`. */
export function readAtPath(
  root: unknown,
  segments: readonly PathSegment[],
): unknown {
  return segments.reduce<unknown>((node, segment) => {
    if (segment.kind === "key") return isRecord(node) ? node[segment.key] : undefined;
    return Array.isArray(node) ? node[segment.index] : undefined;
  }, root);
}
