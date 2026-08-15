/**
 * Ukázání upravovaného textu na stránce.
 *
 * Hledá se podle obsahu, ne podle atributů - komponenty webu tak nemusely
 * dostat žádné značky navíc. Když se text nenajde (nebo je poskládaný z víc
 * kusů), nic se nestane a panel funguje dál.
 */

export const PANEL_ATTRIBUTE = "data-domecek-edit";

/**
 * Nadpisy sekcí se lámou na svislítku a každá půlka je v DOM zvlášť, proto se
 * kromě celého textu zkouší i jednotlivé části.
 */
function candidates(value: string): string[] {
  const trimmed = value.trim();
  const parts = trimmed
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);

  return [...new Set([trimmed, ...parts])].filter((part) => part.length > 2);
}

export function findElementByText(
  doc: Document,
  value: string,
): HTMLElement | null {
  const targets = candidates(value);
  if (targets.length === 0 || !doc.body) return null;

  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || parent.closest(`[${PANEL_ATTRIBUTE}]`)) {
        return NodeFilter.FILTER_REJECT;
      }

      const text = node.nodeValue?.trim() ?? "";
      return targets.includes(text)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });

  return walker.nextNode()?.parentElement ?? null;
}

export type ActiveHighlight = { readonly clear: () => void };

/** Orámuje nalezený text a odscrolluje na něj. Vrací úklid. */
export function highlight(
  doc: Document,
  value: string,
): ActiveHighlight | null {
  const element = findElementByText(doc, value);
  if (!element) return null;

  const previous = {
    outline: element.style.outline,
    outlineOffset: element.style.outlineOffset,
    borderRadius: element.style.borderRadius,
  };

  element.style.outline = "2px solid #195d36";
  element.style.outlineOffset = "3px";
  element.style.borderRadius = element.style.borderRadius || "4px";
  element.scrollIntoView({ block: "center", behavior: "smooth" });

  return {
    clear() {
      element.style.outline = previous.outline;
      element.style.outlineOffset = previous.outlineOffset;
      element.style.borderRadius = previous.borderRadius;
    },
  };
}
