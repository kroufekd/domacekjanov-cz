import type { EditableField } from "@/lib/edit/fields";

import {
  bindField,
  indexTextNodes,
  narrowBinding,
  nodeRect,
  readValue,
  resolveClaims,
  splitParts,
  textNodeAtPoint,
  writeParts,
  type FieldBinding,
} from "./frame-nodes";
import { createOverlay, type Overlay } from "./frame-overlay";

/**
 * Živé spojení mezi panelem a webem v rámu.
 *
 * Umí tři věci: promítat psaní z panelu do stránky, nechat psát rovnou do
 * stránky a při scrollování rámu hlásit, u kterého textu se čtenář nachází -
 * podle toho se panel posouvá na odpovídající pole.
 *
 * Rám je ze stejné domény, takže se do něj sahá přímo. Žádné posílání zpráv.
 */

export type FrameListeners = {
  /** Psaní přímo do stránky. */
  readonly onInlineChange: (fieldKey: string, value: string) => void;
  /** Který text je zrovna v rámu na očích. */
  readonly onVisibleField: (fieldKey: string) => void;
};

export type FrameBridge = {
  /** Panel se přihlásí k odběru; poslední přihlášení platí. */
  listen: (listeners: FrameListeners) => void;
  /** Po načtení rámu i po načtení polí do panelu. */
  refresh: (fields: readonly EditableField[]) => void;
  apply: (field: EditableField, value: string) => void;
  reset: (field: EditableField) => void;
  focusField: (field: EditableField) => void;
  blurField: () => void;
  setInlineEnabled: (enabled: boolean) => void;
  /** Panel právě vede - chvíli neposlouchat scroll rámu. */
  hold: (ms?: number) => void;
  dispose: () => void;
};

export type FrameBridgeOptions = {
  readonly getDocument: () => Document | null;
};

type Owner = { readonly key: string; readonly part: number };

type Editing = {
  readonly key: string;
  readonly span: HTMLSpanElement;
  readonly node: Text;
  readonly before: string;
};

/** Text v této výšce rámu panel považuje za ten, o který jde. */
const FOCUS_LINE = 0.35;

/**
 * Jak dlouho po zásahu z panelu neposlouchat scroll rámu. Bez toho by se skok
 * vyvolaný panelem vrátil zpátky jako "tady je vidět tenhle text" a panel by
 * si sám ujel jinam.
 */
const SETTLE_MS = 900;

/** Kratší pauza při psaní - stačí, aby dojel plynulý scroll po přeformátování. */
const TYPING_HOLD_MS = 1_500;

export function createFrameBridge(options: FrameBridgeOptions): FrameBridge {
  const bindings = new Map<string, FieldBinding>();
  const owners = new Map<Text, Owner>();
  let tops: Array<{ key: string; top: number }> = [];

  let doc: Document | null = null;
  let overlay: Overlay | null = null;
  let cleanups: Array<() => void> = [];
  let editing: Editing | null = null;
  let inlineEnabled = true;
  let visibleKey: string | null = null;
  let settleUntil = 0;
  let measureTimer = 0;
  let listeners: FrameListeners = {
    onInlineChange: () => {},
    onVisibleField: () => {},
  };

  const view = (): Window | null => doc?.defaultView ?? null;

  /* ---------------------------------------------------------------- pozice */

  const measure = () => {
    const current = doc;
    const window = view();
    if (!current || !window) return;

    tops = [...bindings.values()]
      .map((binding) => {
        const node = binding.groups[0]?.[0];
        const rect = node ? nodeRect(current, node) : null;
        return rect
          ? { key: binding.field.key, top: rect.top + window.scrollY }
          : null;
      })
      .filter((entry): entry is { key: string; top: number } => entry !== null)
      .sort((left, right) => left.top - right.top);
  };

  const scheduleMeasure = () => {
    const window = view();
    if (!window) return;

    window.clearTimeout(measureTimer);
    measureTimer = window.setTimeout(measure, 400);
  };

  const reportVisible = () => {
    const window = view();
    if (!window || tops.length === 0) return;

    const line = window.scrollY + window.innerHeight * FOCUS_LINE;
    const found = tops.reduce(
      (best, entry) => (entry.top <= line ? entry : best),
      tops[0],
    );

    if (found.key !== visibleKey) {
      visibleKey = found.key;
      listeners.onVisibleField(found.key);
    }
  };

  /* ------------------------------------------------------------ psaní v rámu */

  /** Znaková pozice kurzoru v editovaném úseku. */
  const caretOffset = (span: HTMLSpanElement): number => {
    const selection = doc?.getSelection();
    if (!selection || selection.rangeCount === 0) return 0;

    const range = selection.getRangeAt(0);
    const measureRange = range.cloneRange();
    measureRange.selectNodeContents(span);
    measureRange.setEnd(range.endContainer, range.endOffset);

    return measureRange.toString().length;
  };

  const setCaret = (node: Text, offset: number) => {
    const selection = doc?.getSelection();
    if (!doc || !selection) return;

    const range = doc.createRange();
    range.setStart(node, Math.min(offset, node.length));
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const showActive = (node: Text) => {
    const current = doc;
    if (!current) return;

    const rect = nodeRect(current, node);
    if (rect) overlay?.show("active", rect);
  };

  const handleInput = () => {
    const current = editing;
    if (!current || !doc) return;

    const text = current.span.textContent ?? "";

    // Prohlížeč při psaní uzel občas rozseká nebo vymění. Vracíme si ten svůj,
    // jinak by se přetrhla vazba na pole a další úprava by se ztratila.
    //
    // Dokud je uvnitř jen on, nesahá se na něj: přiřazení `nodeValue` sráží
    // kurzor na začátek a psalo by se pozpátku.
    if (
      current.span.childNodes.length !== 1 ||
      current.span.firstChild !== current.node
    ) {
      const offset = caretOffset(current.span);
      current.node.nodeValue = text;
      current.span.replaceChildren(current.node);
      setCaret(current.node, offset);
    }

    const binding = bindings.get(current.key);
    if (!binding) return;

    // Stejný text může na stránce být na víc místech; ostatní se dorovnají.
    const part = owners.get(current.node)?.part ?? 0;
    binding.groups[part]?.forEach((node) => {
      if (node !== current.node) node.nodeValue = text;
    });

    showActive(current.node);
    listeners.onInlineChange(current.key, readValue(binding));
    scheduleMeasure();
  };

  const endEdit = () => {
    const current = editing;
    editing = null;
    if (!current) return;

    current.span.removeEventListener("input", handleInput);
    current.span.contentEditable = "false";
    current.span.replaceWith(...current.span.childNodes);

    overlay?.hide("active");
    scheduleMeasure();
  };

  const cancelEdit = () => {
    const current = editing;
    if (!current) return;

    current.node.nodeValue = current.before;
    const binding = bindings.get(current.key);
    if (binding) listeners.onInlineChange(current.key, readValue(binding));

    endEdit();
  };

  const beginEdit = (node: Text, offset: number) => {
    const current = doc;
    const owner = owners.get(node);
    if (!current || !owner) return;

    endEdit();

    const span = current.createElement("span");
    span.dataset.domecekEditing = "";
    span.style.outline = "none";
    node.parentNode?.insertBefore(span, node);
    span.appendChild(node);

    // `plaintext-only` drží prostý text i při vkládání ze schránky. Kde ho
    // prohlížeč nezná, spadne to na `true` a hlídá se aspoň Enter.
    span.contentEditable = "plaintext-only";
    if (span.contentEditable !== "plaintext-only") {
      span.contentEditable = "true";
    }

    span.addEventListener("input", handleInput);
    span.focus({ preventScroll: true });
    setCaret(node, offset);

    editing = { key: owner.key, span, node, before: node.nodeValue ?? "" };
    showActive(node);
  };

  /* ------------------------------------------------------------- posluchači */

  const attach = () => {
    const current = doc;
    const window = view();
    if (!current || !window) return;

    const onMouseMove = (event: MouseEvent) => {
      if (!inlineEnabled || editing) return;

      const hit = textNodeAtPoint(current, event.clientX, event.clientY);
      const key = hit ? owners.get(hit.node) : undefined;
      const rect = hit && key ? nodeRect(current, hit.node) : null;

      if (rect) {
        overlay?.show("hover", rect);
        current.body.style.cursor = "text";
      } else {
        overlay?.hide("hover");
        current.body.style.cursor = "";
      }
    };

    /** Kliknutí do napojeného textu patří editaci, ne odkazu pod ním. */
    const swallow = (event: MouseEvent): boolean => {
      if (!inlineEnabled) return false;
      if (editing?.span.contains(event.target as Node)) return false;

      const hit = textNodeAtPoint(current, event.clientX, event.clientY);
      return Boolean(hit && owners.has(hit.node));
    };

    const onMouseDown = (event: MouseEvent) => {
      if (event.button !== 0 || !swallow(event)) return;

      event.preventDefault();
      event.stopPropagation();

      const hit = textNodeAtPoint(current, event.clientX, event.clientY);
      if (hit) beginEdit(hit.node, hit.offset);
    };

    const onClick = (event: MouseEvent) => {
      if (!swallow(event)) return;
      event.preventDefault();
      event.stopPropagation();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (!editing) return;

      if (event.key === "Enter") {
        event.preventDefault();
        endEdit();
      }

      if (event.key === "Escape") {
        event.preventDefault();
        cancelEdit();
      }
    };

    const onFocusOut = (event: FocusEvent) => {
      if (editing && event.target === editing.span) endEdit();
    };

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        if (editing || Date.now() < settleUntil) return;
        reportVisible();
      });
    };

    const onResize = () => {
      measure();
      overlay?.hideAll();
    };

    current.addEventListener("mousemove", onMouseMove, true);
    current.addEventListener("mousedown", onMouseDown, true);
    current.addEventListener("click", onClick, true);
    current.addEventListener("keydown", onKeyDown, true);
    current.addEventListener("focusout", onFocusOut, true);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    cleanups = [
      () => current.removeEventListener("mousemove", onMouseMove, true),
      () => current.removeEventListener("mousedown", onMouseDown, true),
      () => current.removeEventListener("click", onClick, true),
      () => current.removeEventListener("keydown", onKeyDown, true),
      () => current.removeEventListener("focusout", onFocusOut, true),
      () => window.removeEventListener("scroll", onScroll),
      () => window.removeEventListener("resize", onResize),
      () => window.cancelAnimationFrame(frame),
      () => {
        current.body.style.cursor = "";
      },
    ];
  };

  const detach = () => {
    endEdit();
    cleanups.forEach((cleanup) => cleanup());
    cleanups = [];
    overlay?.dispose();
    overlay = null;
  };

  /* ------------------------------------------------------------------ API */

  return {
    listen(next) {
      listeners = next;
    },

    refresh(fields) {
      detach();

      doc = options.getDocument();
      const current = doc;
      if (!current?.body) return;

      const index = indexTextNodes(current);
      bindings.clear();
      owners.clear();
      visibleKey = null;

      // Napojení má dvě kola: nejdřív si každé pole vezme, co se shoduje, a
      // teprve pak se rozsoudí uzly, o které se hlásí víc polí naráz.
      const claimed = fields
        .map((field) => bindField(index, field))
        .filter((binding): binding is FieldBinding => binding !== null);

      const ownerOf = resolveClaims(claimed);

      claimed.forEach((binding) => {
        const narrowed = narrowBinding(binding, ownerOf);
        if (!narrowed) return;

        bindings.set(narrowed.field.key, narrowed);
        narrowed.groups.forEach((nodes, part) => {
          nodes.forEach((node) =>
            owners.set(node, { key: narrowed.field.key, part }),
          );
        });
      });

      overlay = createOverlay(current);
      attach();
      measure();
      reportVisible();
    },

    apply(field, value) {
      // Když se píše přímo do stránky, zdrojem pravdy je DOM.
      if (editing?.key === field.key) return;

      const binding = bindings.get(field.key);
      if (binding) {
        writeParts(binding, splitParts(value));
        scheduleMeasure();
      }
    },

    reset(field) {
      const binding = bindings.get(field.key);
      if (binding) writeParts(binding, splitParts(field.value));
    },

    focusField(field) {
      const current = doc;
      const window = view();
      const node = bindings.get(field.key)?.groups[0]?.[0];
      if (!current || !window || !node) return;

      const rect = nodeRect(current, node);
      if (!rect) return;

      overlay?.show("active", rect);
      settleUntil = Date.now() + SETTLE_MS;
      visibleKey = field.key;

      window.scrollTo({
        top: rect.top + window.scrollY - window.innerHeight * FOCUS_LINE,
        behavior: "smooth",
      });
    },

    blurField() {
      if (!editing) overlay?.hide("active");
    },

    hold(ms = TYPING_HOLD_MS) {
      settleUntil = Date.now() + ms;
    },

    setInlineEnabled(enabled) {
      inlineEnabled = enabled;
      if (!enabled) {
        endEdit();
        overlay?.hide("hover");
        if (doc?.body) doc.body.style.cursor = "";
      }
    },

    dispose() {
      detach();
      bindings.clear();
      owners.clear();
      tops = [];
      doc = null;
    },
  };
}
