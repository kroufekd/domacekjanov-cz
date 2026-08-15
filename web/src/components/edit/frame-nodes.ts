import type { EditableField } from "@/lib/edit/fields";

/**
 * Napojení polí z panelu na text v rámu s webem.
 *
 * Hledá se podle obsahu, ne podle atributů - komponenty webu tak nemusely
 * dostat žádné značky navíc. Nalezené textové uzly si držíme, protože po první
 * změně by se podle původního znění už nenašlo nic.
 *
 * Co se nenajde (typicky text, do kterého se před vykreslením doplňuje počet
 * fotek nebo ročník ocenění), zůstane nenapojené a v rámu se s ním nedá dělat
 * nic. Panel funguje dál.
 */

/** Titulky sekcí se lámou na svislítku a každá půlka je v DOM zvlášť. */
export function splitParts(value: string): string[] {
  const parts = value
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.length > 0 ? parts : [value.trim()];
}

export type FieldBinding = {
  readonly field: EditableField;
  /** Uzly pro každou část; stejný text může na stránce být na víc místech. */
  readonly groups: readonly (readonly Text[])[];
};

/**
 * Jeden průchod dokumentem místo jednoho na pole. Klíčem je oříznutý text,
 * takže si pole svoje uzly jen vyzvedne.
 */
export function indexTextNodes(doc: Document): Map<string, Text[]> {
  const index = new Map<string, Text[]>();
  if (!doc.body) return index;

  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.nodeValue?.trim() ?? "";
    if (text.length < 2) continue;

    const known = index.get(text);
    if (known) {
      known.push(node as Text);
    } else {
      index.set(text, [node as Text]);
    }
  }

  return index;
}

export function bindField(
  index: Map<string, Text[]>,
  field: EditableField,
): FieldBinding | null {
  const parts = splitParts(field.value);
  const groups = parts.map((part) => index.get(part) ?? []);

  return groups.some((group) => group.length > 0)
    ? { field, groups }
    : null;
}

/** Zapíše části zpátky do všech uzlů, které k poli patří. */
export function writeParts(
  binding: FieldBinding,
  parts: readonly string[],
): void {
  binding.groups.forEach((nodes, index) => {
    // Jediné místo v DOM nese celý text, i když si ho editor rozdělil
    // svislítkem. Naopak ubrané svislítko druhý řádek vyprázdní.
    const text =
      binding.groups.length === 1 ? parts.join(" ") : (parts[index] ?? "");

    nodes.forEach((node) => {
      node.nodeValue = text;
    });
  });
}

/**
 * Složí hodnotu pole z toho, co je právě v rámu. Používá se po psaní přímo do
 * stránky, kdy je zdrojem pravdy DOM a ne políčko v panelu.
 */
export function readValue(binding: FieldBinding): string {
  const parts = binding.groups.map(
    (nodes) => nodes[0]?.nodeValue?.trim() ?? "",
  );

  return parts.filter(Boolean).join("|");
}

/** Obdélník textu, ne celého odstavce - `Range` umí i kus uvnitř řádku. */
export function nodeRect(doc: Document, node: Text): DOMRect | null {
  const range = doc.createRange();
  range.selectNodeContents(node);
  const rect = range.getBoundingClientRect();
  range.detach();

  return rect.width === 0 && rect.height === 0 ? null : rect;
}

/** Textový uzel pod kurzorem. Prohlížeče na to mají dvě různá jména. */
export function textNodeAtPoint(
  doc: Document,
  x: number,
  y: number,
): { node: Text; offset: number } | null {
  type LegacyDocument = Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
  };

  const position = doc.caretPositionFromPoint?.(x, y);
  if (position?.offsetNode.nodeType === Node.TEXT_NODE) {
    return { node: position.offsetNode as Text, offset: position.offset };
  }

  const range = (doc as LegacyDocument).caretRangeFromPoint?.(x, y);
  if (range?.startContainer.nodeType === Node.TEXT_NODE) {
    return { node: range.startContainer as Text, offset: range.startOffset };
  }

  return null;
}

/**
 * Kde na stránce text stojí. Menu a patička opakují názvy sekcí ("Galerie",
 * "Ceník"), takže by se stejné znění napojilo na víc polí naráz a scroll by
 * skákal na položku menu místo na nadpis sekce.
 */
export type NodeScope = "chrome" | "footer" | "content";

export function fieldScope(field: EditableField): NodeScope {
  if (field.path.startsWith("nav.")) return "chrome";
  if (field.path.startsWith("footer.")) return "footer";
  return "content";
}

export function nodeScope(node: Text): NodeScope {
  const element = node.parentElement;
  if (!element) return "content";
  if (element.closest("footer")) return "footer";
  if (element.closest("header, nav")) return "chrome";
  return "content";
}

/**
 * Rozdělí sporné uzly mezi pole, která si je nárokují. Vyhrává to, které patří
 * do stejné části stránky; při shodě to, které je v panelu dřív.
 */
export function resolveClaims(
  bindings: readonly FieldBinding[],
): Map<Text, string> {
  const claims = new Map<Text, FieldBinding[]>();

  bindings.forEach((binding) => {
    binding.groups.flat().forEach((node) => {
      const known = claims.get(node);
      if (known) {
        known.push(binding);
      } else {
        claims.set(node, [binding]);
      }
    });
  });

  return new Map(
    [...claims].map(([node, claimants]) => {
      const scope = nodeScope(node);
      const winner =
        claimants.find((binding) => fieldScope(binding.field) === scope) ??
        claimants[0];

      return [node, winner.field.key];
    }),
  );
}

/** Nechá poli jen uzly, které mu po rozsouzení opravdu patří. */
export function narrowBinding(
  binding: FieldBinding,
  ownerOf: Map<Text, string>,
): FieldBinding | null {
  const groups = binding.groups.map((nodes) =>
    nodes.filter((node) => ownerOf.get(node) === binding.field.key),
  );

  return groups.some((nodes) => nodes.length > 0)
    ? { field: binding.field, groups }
    : null;
}
