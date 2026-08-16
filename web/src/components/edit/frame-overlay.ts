/**
 * Rámečky kreslené do stránky v náhledu.
 *
 * Vlastní vrstva místo `outline` na nalezeném elementu: text bývá jen kusem
 * odstavce a orámovaný odstavec by mátl. `Range` navíc umí obtáhnout přesně
 * ten úsek, o který jde.
 *
 * Vrstva má `pointer-events: none`, takže pod ní jde dál klikat.
 */

export type OverlayKind = "hover" | "active";

const STYLE: Record<OverlayKind, string> = {
  hover: "1px dashed rgba(25, 93, 54, 0.7)",
  active: "2px solid #195d36",
};

export type Overlay = {
  /** `rect` je ve souřadnicích viewportu rámu. */
  show: (kind: OverlayKind, rect: DOMRect) => void;
  hide: (kind: OverlayKind) => void;
  hideAll: () => void;
  dispose: () => void;
};

function createBox(doc: Document, kind: OverlayKind): HTMLDivElement {
  const box = doc.createElement("div");
  box.dataset.domecekOverlay = kind;
  box.style.cssText = [
    "position:absolute",
    "pointer-events:none",
    "z-index:2147483000",
    "border-radius:4px",
    "display:none",
    `border:${STYLE[kind]}`,
  ].join(";");

  return box;
}

export function createOverlay(doc: Document): Overlay {
  const boxes = new Map<OverlayKind, HTMLDivElement>();

  const boxFor = (kind: OverlayKind): HTMLDivElement | null => {
    if (!doc.body) return null;

    const known = boxes.get(kind);
    if (known?.isConnected) return known;

    const box = createBox(doc, kind);
    doc.body.appendChild(box);
    boxes.set(kind, box);
    return box;
  };

  return {
    show(kind, rect) {
      const box = boxFor(kind);
      if (!box) return;

      const view = doc.defaultView;
      const offsetX = view?.scrollX ?? 0;
      const offsetY = view?.scrollY ?? 0;
      const padding = 3;

      box.style.display = "block";
      box.style.left = `${rect.left + offsetX - padding}px`;
      box.style.top = `${rect.top + offsetY - padding}px`;
      box.style.width = `${rect.width + padding * 2}px`;
      box.style.height = `${rect.height + padding * 2}px`;
    },

    hide(kind) {
      const box = boxes.get(kind);
      if (box) box.style.display = "none";
    },

    hideAll() {
      boxes.forEach((box) => {
        box.style.display = "none";
      });
    },

    dispose() {
      boxes.forEach((box) => box.remove());
      boxes.clear();
    },
  };
}
