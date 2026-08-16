import { fieldLabel } from "@/lib/edit/labels";
import type { SiteContent } from "@/types/content";

/**
 * Seznam textů, které jde upravit z webu.
 *
 * Není psaný ručně - odvozuje se z obsahu, který stránka právě vykreslila.
 * Díky tomu se nemůže rozejít s typem `SiteContent`: co přibude v textech,
 * objeví se v panelu samo. Cenou je, že se seznam musí odvodit i na serveru
 * při ukládání, protože je zároveň jediným povoleným rozsahem zápisu.
 */

export const SITE_COPY_ID = "siteCopy-main";
export const SITE_SETTINGS_ID = "siteSettings-main";
export const ACCOMMODATION_ID = "accommodation-main";

/** Ceníkové položky jsou samostatné dokumenty, jeden na sazbu. */
const RATE_ID_PATTERN = /^rate-[a-z0-9][a-z0-9-]{0,60}$/;

const KNOWN_DOCUMENT_IDS: ReadonlySet<string> = new Set([
  SITE_COPY_ID,
  SITE_SETTINGS_ID,
  ACCOMMODATION_ID,
]);

/**
 * Poslední pojistka před zápisem. Fallbackový obsah má u sazeb jiná id než
 * dataset (`summer` místo `rate-summer`), takže bez téhle kontroly by šlo
 * omylem patchovat dokument, který s ceníkem nemá nic společného.
 */
export function isWritableDocumentId(id: string): boolean {
  return KNOWN_DOCUMENT_IDS.has(id) || RATE_ID_PATTERN.test(id);
}

/** `line` je jednořádkový vstup, `block` odstavec. */
export type EditableFieldType = "line" | "block";

export type EditableField = {
  /** Co posílá prohlížeč zpátky. Nese dokument i cestu, ověřuje se obojí. */
  readonly key: string;
  readonly documentId: string;
  /** Cesta v dokumentu bez jazyka, např. `garden.title` nebo `rooms[0].title`. */
  readonly path: string;
  /** Zda se pod cestou skrývá objekt `{cs, de, en}`. */
  readonly localized: boolean;
  readonly type: EditableFieldType;
  readonly label: string;
  readonly value: string;
  /** Poznámka pod popiskem, když se text chová jinak, než jak vypadá. */
  readonly hint?: string;
};

export type EditableGroup = {
  readonly id: string;
  readonly title: string;
  readonly fields: readonly EditableField[];
};

export const fieldKey = (documentId: string, path: string): string =>
  `${documentId}:${path}`;

/** Delší text dostane v panelu textareu místo jednořádkového vstupu. */
const BLOCK_PATHS: ReadonlySet<string> = new Set([
  "description",
  "cardText",
  "tagline",
  "viewerCaption",
  "heroDescription",
  "seoDescription",
  "teaser",
  "introText",
  "summary",
]);

function fieldType(path: string, value: string): EditableFieldType {
  const leaf = (path.split(".").at(-1) ?? "").replace(/\[\d+\]$/, "");
  return BLOCK_PATHS.has(leaf) || value.length > 90 ? "block" : "line";
}

const HEADING_HINT =
  "Text za svislítkem | se zalomí na druhý řádek a vysází kurzívou.";

/**
 * Titulky sekcí projdou `splitHeading`, takže svislítko v nich není překlep -
 * bez upozornění by ho editor smazal a nadpis by přišel o druhý řádek.
 */
function fieldHint(documentId: string, path: string): string | undefined {
  const isSectionTitle =
    documentId === SITE_COPY_ID && path.endsWith(".title");
  const isIntroTitle =
    documentId === ACCOMMODATION_ID && path === "introTitle";

  return isSectionTitle || isIntroTitle ? HEADING_HINT : undefined;
}

/**
 * Pole, která přeložená nejsou a drží prostý řetězec. Zapsat do
 * nich `{cs: …}` by rozbilo normalizaci, která u nich čeká string.
 */
const PLAIN_PATHS: ReadonlySet<string> = new Set([
  `${SITE_SETTINGS_ID}:phoneDisplay`,
  `${SITE_SETTINGS_ID}:email`,
]);

function isLocalized(documentId: string, path: string): boolean {
  if (RATE_ID_PATTERN.test(documentId)) return path !== "price";
  return !PLAIN_PATHS.has(fieldKey(documentId, path));
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

type Scope = "copy" | "settings" | "accommodation" | "rate";

type WalkOptions = {
  readonly documentId: string;
  readonly scope: Scope;
  /** Cesta v dokumentu, od které se odvíjejí klíče. */
  readonly path: string;
};

/**
 * Projde hodnotu a udělá z každého řetězce jedno pole. Čísla, boolean a
 * obrázky se přeskakují - editační režim je na texty.
 */
function walk(value: unknown, options: WalkOptions): EditableField[] {
  const { documentId, scope, path } = options;

  if (typeof value === "string") {
    const hint = fieldHint(documentId, path);

    return value.length === 0
      ? []
      : [
          {
            key: fieldKey(documentId, path),
            documentId,
            path,
            localized: isLocalized(documentId, path),
            type: fieldType(path, value),
            label: fieldLabel(scope, path),
            value,
            ...(hint ? { hint } : {}),
          },
        ];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      walk(item, { ...options, path: `${path}[${index}]` }),
    );
  }

  if (isRecord(value)) {
    return Object.entries(value).flatMap(([key, nested]) =>
      walk(nested, { ...options, path: path ? `${path}.${key}` : key }),
    );
  }

  return [];
}

const readAt = (root: unknown, path: string): unknown =>
  path
    .split(".")
    .filter(Boolean)
    .reduce<unknown>(
      (node, key) => (isRecord(node) ? node[key] : undefined),
      root,
    );

type SourceSpec = {
  readonly documentId: string;
  readonly scope: Scope;
  /** Odkud ve `SiteContent` číst. */
  readonly from: string;
  /** Kam to patří v dokumentu úložiště. Prázdné = kořen dokumentu. */
  readonly at: string;
  /** Když je uvedeno, projdou se jen tyhle klíče a v tomhle pořadí. */
  readonly only?: readonly string[];
};

type GroupSpec = {
  readonly id: string;
  readonly title: string;
  readonly sources: readonly SourceSpec[];
};

const copySource = (name: string): SourceSpec => ({
  documentId: SITE_COPY_ID,
  scope: "copy",
  from: `copy.${name}`,
  at: name,
});

const settingsSource = (only: readonly string[]): SourceSpec => ({
  documentId: SITE_SETTINGS_ID,
  scope: "settings",
  from: "settings",
  at: "",
  only,
});

const accommodationSource = (only: readonly string[]): SourceSpec => ({
  documentId: ACCOMMODATION_ID,
  scope: "accommodation",
  from: "accommodation",
  at: "",
  only,
});

/** Pořadí skupin kopíruje, jak jdou sekce po stránce. */
const GROUPS: readonly GroupSpec[] = [
  {
    id: "hero",
    title: "Úvodní obrazovka",
    sources: [
      settingsSource(["heroEyebrow", "heroTitle", "heroDescription"]),
      copySource("hero"),
    ],
  },
  {
    id: "chrome",
    title: "Menu a tlačítka",
    sources: [copySource("nav"), copySource("actions")],
  },
  {
    id: "story",
    title: "O domečku",
    sources: [
      accommodationSource(["introTitle", "introText"]),
      copySource("story"),
    ],
  },
  { id: "garden", title: "Zahrada a terasa", sources: [copySource("garden")] },
  {
    id: "rooms",
    title: "Spaní a vybavení",
    sources: [
      copySource("rooms"),
      accommodationSource(["facts", "rooms", "amenities"]),
    ],
  },
  { id: "gallery", title: "Galerie", sources: [copySource("gallery")] },
  { id: "tour", title: "3D prohlídka", sources: [copySource("tour")] },
  { id: "trips", title: "Výlety po okolí", sources: [copySource("trips")] },
  { id: "pricing", title: "Ceník", sources: [copySource("pricing")] },
  {
    id: "contact",
    title: "Kontakt a patička",
    sources: [
      copySource("contact"),
      copySource("footer"),
      settingsSource(["address", "phoneDisplay", "email"]),
    ],
  },
  { id: "award", title: "Ocenění Booking.com", sources: [copySource("award")] },
  {
    id: "seo",
    title: "Vyhledávače a sdílení",
    sources: [settingsSource(["description", "seoTitle", "seoDescription"])],
  },
];

/** Vybere jen uvedené klíče, a to v pořadí, v jakém jsou zapsané. */
function pick(
  value: unknown,
  only: readonly string[] | undefined,
): Record<string, unknown> | unknown {
  if (!only || !isRecord(value)) return value;

  return Object.fromEntries(
    only
      .filter((key) => value[key] !== undefined)
      .map((key) => [key, value[key]]),
  );
}

function buildSource(
  content: SiteContent,
  source: SourceSpec,
): EditableField[] {
  const node = pick(readAt(content, source.from), source.only);
  return walk(node, {
    documentId: source.documentId,
    scope: source.scope,
    path: source.at,
  });
}

/** Ceník: každá sazba je vlastní dokument, takže se skládá zvlášť. */
function buildRateFields(content: SiteContent): EditableField[] {
  return content.rates
    .filter((rate) => isWritableDocumentId(rate.id))
    .flatMap((rate) =>
      walk(
        {
          title: rate.title,
          price: rate.price,
          unit: rate.unit,
          ...(rate.note === undefined ? {} : { note: rate.note }),
        },
        { documentId: rate.id, scope: "rate", path: "" },
      ),
    );
}

/**
 * Skupiny pro panel. Prázdné skupiny vypadnou, aby se klientovi neukazovala
 * sekce bez jediného pole.
 */
export function buildEditableGroups(
  content: SiteContent,
): readonly EditableGroup[] {
  return GROUPS.map((group) => {
    const fields =
      group.id === "pricing"
        ? [
            ...group.sources.flatMap((source) => buildSource(content, source)),
            ...buildRateFields(content),
          ]
        : group.sources.flatMap((source) => buildSource(content, source));

    return { id: group.id, title: group.title, fields };
  }).filter((group) => group.fields.length > 0);
}

/** Plochá mapa pro ověření zápisu. Klíč, který v ní není, se neuloží. */
export function buildEditableIndex(
  content: SiteContent,
): ReadonlyMap<string, EditableField> {
  return new Map(
    buildEditableGroups(content)
      .flatMap((group) => group.fields)
      .map((field) => [field.key, field]),
  );
}
