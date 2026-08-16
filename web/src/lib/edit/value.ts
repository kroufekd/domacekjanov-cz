import type { EditableFieldType } from "@/lib/edit/fields";

/**
 * Kontrola textu, který přišel z prohlížeče.
 *
 * Prázdná hodnota se odmítá schválně: normalizace obsahu bere prázdný řetězec
 * jako "nevyplněno" a sáhne po vestavěném znění, takže by se text po uložení
 * vrátil zpátky a vypadalo by to jako chyba ukládání.
 */

const LIMITS: Record<EditableFieldType, number> = {
  line: 500,
  block: 5_000,
};

/**
 * Neviditelné znaky umí rozbít sazbu, aniž by v panelu šly vidět. Tabulátor a
 * konec řádku procházejí, zbytek řídicích znaků a nulové mezery ne - ty se do
 * textu dostanou kopírováním z Wordu nebo z webu.
 */
const CONTROL_CHARACTERS =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200D\uFEFF]/g;

export type ValueOutcome =
  | { readonly value: string }
  | { readonly error: string };

export function cleanValue(
  raw: unknown,
  type: EditableFieldType,
): ValueOutcome {
  if (typeof raw !== "string") {
    return { error: "Hodnota musí být text." };
  }

  const normalized = raw
    .replace(/\r\n?/g, "\n")
    .replace(CONTROL_CHARACTERS, "")
    .trim();

  const value =
    type === "line" ? normalized.replace(/\s*\n+\s*/g, " ") : normalized;

  if (value.length === 0) {
    return { error: "Text nesmí zůstat prázdný." };
  }

  if (value.length > LIMITS[type]) {
    return { error: `Text je delší než ${LIMITS[type]} znaků.` };
  }

  return { value };
}
