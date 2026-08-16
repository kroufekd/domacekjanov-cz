import type { Locale } from "@/i18n/config";
import type { EditableField } from "@/lib/edit/fields";
import {
  failed,
  parsePath,
  readAtPath,
  setAtPath,
  type KeyFactory,
  type PatchOutcome,
  type PathSegment,
} from "@/lib/store/patch";

/**
 * Promítne jednu úpravu z panelu do dokumentu v úložišti.
 *
 * Přeložená pole jsou objekty `{cs, de, en}` a zapisuje se do nich jen jazyk,
 * ve kterém klient zrovna kouká - ostatní překlady zůstávají. `_type` se
 * doplňuje jen tehdy, když objekt vzniká teď; přepsat existující `localeText`
 * na `localeString` by ve Studiu vyměnilo víceřádkové pole za jednořádkové.
 */

export type StoreDocument = Record<string, unknown>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const localeTypeFor = (field: EditableField): string =>
  field.type === "block" ? "localeText" : "localeString";

export function applyFieldChange(
  document: StoreDocument,
  field: EditableField,
  locale: Locale,
  value: string,
  makeKey: KeyFactory,
): PatchOutcome<StoreDocument> {
  const segments = parsePath(field.path);
  if (!segments) {
    return { error: `Neplatná cesta "${field.path}".` };
  }

  const options = { makeKey, label: field.label };
  const target: PathSegment[] = field.localized
    ? [...segments, { kind: "key", key: locale }]
    : segments;

  const written = setAtPath(document, target, value, options);
  if (failed(written)) return written;

  if (!isRecord(written.value)) {
    return { error: `${field.label}: dokument nemá očekávaný tvar.` };
  }

  if (!field.localized) return { value: written.value };

  const before = readAtPath(document, segments);
  if (isRecord(before) && typeof before._type === "string") {
    return { value: written.value };
  }

  const typed = setAtPath(
    written.value,
    [...segments, { kind: "key", key: "_type" }],
    localeTypeFor(field),
    options,
  );
  if (failed(typed)) return typed;

  return isRecord(typed.value)
    ? { value: typed.value }
    : { error: `${field.label}: dokument nemá očekávaný tvar.` };
}
