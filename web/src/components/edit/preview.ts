import type { EditableField } from "@/lib/edit/fields";

/**
 * Živý náhled úprav v rámu s webem.
 *
 * Text se v náhledu hledá podle obsahu, ne podle atributů - komponenty webu
 * tak nemusely dostat žádné značky navíc. Nalezené textové uzly si držíme,
 * takže druhá a další úprava už nehledá (po první změně by se stejně podle
 * původního znění nenašlo nic).
 *
 * Když se text nenajde - typicky proto, že se do něj před vykreslením doplňuje
 * počet fotek nebo ročník ocenění - náhled se prostě nezmění a po uložení se
 * rám načte znovu. Nic se nerozbije.
 */

export const PANEL_ATTRIBUTE = "data-domecek-edit";

/**
 * Titulky sekcí se lámou na svislítku a každá půlka je v DOM zvlášť, proto se
 * hodnota rozpadá na části a každá se hledá samostatně.
 */
function splitParts(value: string): string[] {
  const parts = value
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.length > 0 ? parts : [value.trim()];
}

function collectNodes(doc: Document, text: string): Text[] {
  if (text.length < 2 || !doc.body) return [];

  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node.nodeValue?.trim() === text
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT,
  });

  const found: Text[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    found.push(node as Text);
  }

  return found;
}

type Binding = {
  readonly parts: readonly string[];
  /** Uzly pro každou část; stejný text může na stránce být na víc místech. */
  readonly nodes: readonly (readonly Text[])[];
};

type Marker = {
  readonly element: HTMLElement;
  readonly outline: string;
  readonly outlineOffset: string;
  readonly borderRadius: string;
};

export type Preview = {
  /** Promítne rozepsanou hodnotu do rámu. */
  apply: (field: EditableField, value: string) => void;
  /** Vrátí pole na znění, se kterým panel začínal. */
  reset: (field: EditableField) => void;
  highlight: (field: EditableField) => void;
  clearHighlight: () => void;
  /** Po znovunačtení rámu jsou staré uzly k ničemu. */
  invalidate: () => void;
};

export function createPreview(getDocument: () => Document | null): Preview {
  const bindings = new Map<string, Binding>();
  let marker: Marker | null = null;

  const bindingFor = (field: EditableField): Binding | null => {
    const known = bindings.get(field.key);
    if (known) return known;

    const doc = getDocument();
    if (!doc) return null;

    const parts = splitParts(field.value);
    const binding: Binding = {
      parts,
      nodes: parts.map((part) => collectNodes(doc, part)),
    };

    bindings.set(field.key, binding);
    return binding;
  };

  const write = (binding: Binding, parts: readonly string[]) => {
    binding.nodes.forEach((nodes, index) => {
      // Jediné místo v DOM nese celý text, i když si ho editor rozdělil
      // svislítkem. Naopak ubrané svislítko druhý řádek vyprázdní.
      const text =
        binding.nodes.length === 1 ? parts.join(" ") : (parts[index] ?? "");

      nodes.forEach((node) => {
        node.nodeValue = text;
      });
    });
  };

  const clearHighlight = () => {
    if (!marker) return;
    marker.element.style.outline = marker.outline;
    marker.element.style.outlineOffset = marker.outlineOffset;
    marker.element.style.borderRadius = marker.borderRadius;
    marker = null;
  };

  return {
    apply(field, value) {
      const binding = bindingFor(field);
      if (binding) write(binding, splitParts(value));
    },

    reset(field) {
      const binding = bindings.get(field.key);
      if (binding) write(binding, binding.parts);
    },

    highlight(field) {
      clearHighlight();

      const element = bindingFor(field)?.nodes[0]?.[0]?.parentElement;
      if (!element) return;

      marker = {
        element,
        outline: element.style.outline,
        outlineOffset: element.style.outlineOffset,
        borderRadius: element.style.borderRadius,
      };

      element.style.outline = "2px solid #195d36";
      element.style.outlineOffset = "3px";
      element.style.borderRadius = element.style.borderRadius || "4px";
      element.scrollIntoView({ block: "center", behavior: "smooth" });
    },

    clearHighlight,

    invalidate() {
      marker = null;
      bindings.clear();
    },
  };
}
