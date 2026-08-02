import { createClient } from "@sanity/client";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Rozdílově dosynchronizuje do Sanity jen ta pole, která se změnila v kódu.
 *
 * Živý dataset má klientovy editace ze Studia, takže se nesmí použít `seed.mjs`
 * (staví dataset od nuly přes `createOrReplace` a přemazal by je). Tenhle skript
 * proto umí jedinou věc: adresný `patch` na konkrétní cestu. Nic nevytváří,
 * nic nemaže, sousední pole nechává být.
 *
 * Výchozí režim je náhled - jen vypíše, co by se změnilo. Zapisuje se teprve
 * s argumentem `--write` a s tokenem v `SANITY_API_WRITE_TOKEN`.
 *
 *   node scripts/sync-content.mjs            # náhled, token není potřeba
 *   node scripts/sync-content.mjs --write    # zápis
 *
 * Zdrojem hodnot jsou tytéž fallback JSONy, ze kterých čte web, texty výletů
 * z `web/src/data/trip-text` a kategorie fotek `galleryImageDefinitions`
 * z `web/src/lib/content/shared.ts`. Nic se tu tedy nepíše podruhé ručně - co
 * se změní v kódu, to skript nabídne k zápisu.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const TEXT_DIRECTORY = resolve(HERE, "../../web/src/lib/content/text");
const TRIP_TEXT_DIRECTORY = resolve(HERE, "../../web/src/data/trip-text");
const SHARED_CONTENT_FILE = resolve(HERE, "../../web/src/lib/content/shared.ts");

/** Jazyky, ve kterých web běží. Čeština je ta, na kterou se padá zpátky. */
const LOCALES = ["cs", "de", "en"];

const SITE_COPY_ID = "siteCopy-main";
const ACCOMMODATION_ID = "accommodation-main";

/** Výlety, jejichž popis se v repu přepsal. Zbytek si Studio řídí samo. */
const TRIP_SUMMARY_IDS = ["vileminina-stena", "mala-pravcicka-brana"];

const write = process.argv.slice(2).includes("--write");
const token = process.env.SANITY_API_WRITE_TOKEN;

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || "lli7g5ge";
const dataset = process.env.SANITY_STUDIO_DATASET || "production";

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2026-07-24",
  // Náhled běží i bez tokenu, publikovaná data jsou ke čtení veřejně.
  ...(token ? { token } : {}),
  useCdn: false,
});

// --- Zdroj pravdy: fallback JSONy webu -------------------------------------

const readByLocale = (directory) =>
  Object.fromEntries(
    LOCALES.map((locale) => [
      locale,
      JSON.parse(readFileSync(resolve(directory, `${locale}.json`), "utf8")),
    ]),
  );

const texts = readByLocale(TEXT_DIRECTORY);
const tripTexts = readByLocale(TRIP_TEXT_DIRECTORY);
const czech = texts.cs;

/**
 * Jeden `{cs, de, en}` objekt. Jazyk bez hodnoty se vynechá, ať se do datasetu
 * nedostane `undefined` místo textu.
 */
const localizedFrom = (source, type, pick) =>
  Object.fromEntries([
    ["_type", type],
    ...LOCALES.map((locale) => [locale, pick(source[locale])]).filter(
      ([, value]) => typeof value === "string" && value.trim(),
    ),
  ]);

const lstr = (pick) => localizedFrom(texts, "localeString", pick);
const ltext = (pick) => localizedFrom(texts, "localeText", pick);

// --- Zdroj pravdy: kategorie fotek ze `shared.ts` ---------------------------

/**
 * Vytáhne dvojice `id → category` z `galleryImageDefinitions`. Je to TypeScript,
 * který se z `.mjs` naimportovat nedá, takže se čte textem. Aby z přeformátování
 * souboru nevznikl tichý nesmysl, výsledek se hned porovná s klíči v JSONech
 * a se seznamem kategorií - při jakémkoli rozporu skript skončí.
 */
const readGalleryCategories = () => {
  const source = readFileSync(SHARED_CONTENT_FILE, "utf8");
  const start = source.indexOf("export const galleryImageDefinitions");
  const end = source.indexOf("\n];", start);

  if (start < 0 || end < 0) {
    throw new Error(
      `V ${SHARED_CONTENT_FILE} nejde najít pole galleryImageDefinitions.`,
    );
  }

  const entries = [...source.slice(start, end).matchAll(/\{[^{}]*\}/g)]
    .map(([block]) => ({
      id: block.match(/id:\s*"([^"]+)"/)?.[1],
      category: block.match(/category:\s*"([^"]+)"/)?.[1],
    }))
    .filter(({ id }) => id);

  const knownCategories = new Set(
    Object.keys(czech.copy.gallery.categories).filter((key) => key !== "vse"),
  );
  const knownIds = new Set(Object.keys(czech.gallery));

  const broken = entries.filter(
    ({ id, category }) => !knownIds.has(id) || !knownCategories.has(category),
  );
  const unmatched = [...knownIds].filter(
    (id) => !entries.some((entry) => entry.id === id),
  );

  if (broken.length > 0 || unmatched.length > 0) {
    throw new Error(
      "Kategorie fotek ze shared.ts nesedí na fallback JSONy. " +
        `Neznámé: ${JSON.stringify(broken)}, chybějící: ${unmatched.join(", ")}.`,
    );
  }

  return entries;
};

// --- Co se má srovnat ------------------------------------------------------

/**
 * Lokalizovaný požadavek. Prázdný objekt by v datasetu přepsal text ničím,
 * takže chybějící překlad radši shodí celý skript.
 */
const localeRequirement = (document, path, value, requires) => {
  if (!LOCALES.some((locale) => value[locale] !== undefined)) {
    throw new Error(`Ve fallback JSONech chybí text pro ${document}.${path}.`);
  }

  return {
    document,
    path,
    kind: "locale",
    value,
    ...(requires ? { requires } : {}),
  };
};

/**
 * Nová položka lokalizovaného pole. Použije se, když v repu přibyla odrážka,
 * kterou dataset ještě nezná - `set` na cestu s `_key`, který v poli není,
 * by totiž tiše neudělal nic. Existující položka se nechává být, ať se
 * nepřepíše znění, které mohl majitel doladit ve Studiu.
 */
const localeItemRequirement = (document, path, key, value, requires) => {
  if (!LOCALES.some((locale) => value[locale] !== undefined)) {
    throw new Error(`Ve fallback JSONech chybí text pro ${document}.${path}.`);
  }

  return {
    document,
    path,
    kind: "append",
    key,
    value: { _key: key, ...value },
    ...(requires ? { requires } : {}),
  };
};

/**
 * Požadavek na jedno pole: kam se dívat a co tam má být.
 *
 * `kind` je `locale` pro `{cs, de, en}` objekt, `value` pro prostý řetězec,
 * `remove` pro pole, které má z dokumentu zmizet, `restrict` pro objekt,
 * ve kterém nesmí zůstat jiné klíče než ty vyjmenované, a `append` pro novou
 * položku pole. `requires` je cesta, která v dokumentu musí existovat - patch
 * přes filtr `[_key=="…"]` u chybějící položky totiž tiše neudělá nic, a to by
 * v souhrnu vypadalo jako úspěch.
 */
const buildRequirements = () => {
  const gallery = readGalleryCategories().flatMap(({ id, category }) => {
    const document = `gallery-${id}`;
    const hasCaption = Boolean(czech.gallery[id].caption);

    return [
      { document, path: "category", kind: "value", value: category },
      hasCaption
        ? localeRequirement(
            document,
            "caption",
            lstr((text) => text.gallery[id].caption),
          )
        : // Popisek už v JSONech není, takže musí zmizet i ze Studia.
          { document, path: "caption", kind: "remove" },
    ];
  });

  // Názvy kategorií se řídí klíči z JSONů, ať se přejmenování nebo zrušení
  // kategorie nemusí do skriptu psát ručně. Co v JSONech není, ze Studia zmizí.
  const categoryNames = Object.keys(czech.copy.gallery.categories);
  const categories = [
    ...categoryNames.map((name) =>
      localeRequirement(
        SITE_COPY_ID,
        `gallery.categories.${name}`,
        lstr((text) => text.copy.gallery.categories[name]),
      ),
    ),
    {
      document: SITE_COPY_ID,
      path: "gallery.categories",
      kind: "restrict",
      allowed: categoryNames,
    },
  ];

  const sections = [
    ["story.noteRest", lstr((text) => text.copy.story.noteRest)],
    ["garden.title", lstr((text) => text.copy.garden.title)],
    ["garden.description", ltext((text) => text.copy.garden.description)],
    ["garden.stampTitle", lstr((text) => text.copy.garden.stampTitle)],
    ["garden.stampNote", lstr((text) => text.copy.garden.stampNote)],
    ["garden.cardText", ltext((text) => text.copy.garden.cardText)],
    ["tour.description", ltext((text) => text.copy.tour.description)],
    ["trips.description", ltext((text) => text.copy.trips.description)],
    ["pricing.title", lstr((text) => text.copy.pricing.title)],
    ["pricing.description", ltext((text) => text.copy.pricing.description)],
    ["contact.title", lstr((text) => text.copy.contact.title)],
    ["contact.description", ltext((text) => text.copy.contact.description)],
  ].map(([path, value]) => localeRequirement(SITE_COPY_ID, path, value));

  // Štítek zvýrazněné ceny web ani Studio už nemají, takže musí zmizet
  // i z datasetu - jinak by v něm zůstal text, ke kterému nevede žádné pole.
  const removed = [
    { document: SITE_COPY_ID, path: "pricing.featuredTag", kind: "remove" },
  ];

  // Popisy výletů se srovnávají po jednom. Hromadná synchronizace všech cílů
  // by přebila i texty, které majitel doladil ve Studiu, takže sem patří jen
  // ty, jejichž znění se opravdu změnilo v repu.
  const trips = TRIP_SUMMARY_IDS.map((id) =>
    localeRequirement(
      `trip-text-${id}`,
      "summary",
      localizedFrom(tripTexts, "localeText", (text) => text[id]?.summary),
    ),
  );

  const accommodation = [
    localeRequirement(
      ACCOMMODATION_ID,
      'introText[_key=="item-0"]',
      ltext((text) => text.accommodation.introText[0]),
      'introText[_key=="item-0"]',
    ),
    localeRequirement(
      ACCOMMODATION_ID,
      'facts[_key=="fact-2"].value',
      lstr((text) => text.accommodation.facts[2].value),
      'facts[_key=="fact-2"]',
    ),
    localeRequirement(
      ACCOMMODATION_ID,
      'facts[_key=="fact-2"].label',
      lstr((text) => text.accommodation.facts[2].label),
      'facts[_key=="fact-2"]',
    ),
    localeRequirement(
      ACCOMMODATION_ID,
      'amenities[_key=="amenity-2"].title',
      lstr((text) => text.accommodation.amenities[2].title),
      'amenities[_key=="amenity-2"]',
    ),
    localeItemRequirement(
      ACCOMMODATION_ID,
      'amenities[_key=="amenity-1"].items',
      "item-5",
      lstr((text) => text.accommodation.amenities[1].items[5]),
      'amenities[_key=="amenity-1"]',
    ),
  ];

  return [
    ...sections,
    ...removed,
    ...categories,
    ...accommodation,
    ...trips,
    ...gallery,
  ];
};

// --- Porovnání s datasetem -------------------------------------------------

const SEGMENT_PATTERN = /^([A-Za-z0-9_]+)(?:\[_key=="([^"]+)"\])?$/;

/** Přečte hodnotu na cestě `a.b[_key=="x"].c`. Chybějící mezičlánek nevadí. */
const readPath = (document, path) =>
  path.split(".").reduce((current, segment) => {
    if (current === undefined || current === null) return undefined;

    const match = SEGMENT_PATTERN.exec(segment);
    if (!match) throw new Error(`Neznámý tvar cesty: ${path}`);

    const [, field, key] = match;
    const next = current[field];

    if (key === undefined) return next;
    if (!Array.isArray(next)) return undefined;
    return next.find((item) => item?._key === key);
  }, document);

const isObject = (value) =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Jazykové mutace po jedné. Celý objekt se zapisuje jen tehdy, když v datasetu
 * ještě není (nebo je jiného typu) - jinak by se přepsaly i jazyky, které
 * majitel mohl ve Studiu doladit.
 */
const localeOperations = (path, current, target) => {
  const locales = LOCALES.filter((locale) => target[locale] !== undefined);

  if (!isObject(current) || current._type !== target._type) {
    return [{ kind: "set", path, from: current, to: target }];
  }

  return locales
    .filter((locale) => current[locale] !== target[locale])
    .map((locale) => ({
      kind: "set",
      path: `${path}.${locale}`,
      from: current[locale],
      to: target[locale],
    }));
};

/** Rozdíl mezi požadavkem a dokumentem. Co už sedí, vrátí prázdný seznam. */
const toOperations = (requirement, document) => {
  const { path, kind, value, allowed, requires, key } = requirement;

  if (requires && readPath(document, requires) === undefined) {
    return { skipped: `v datasetu chybí ${requires}`, operations: [] };
  }

  const current = readPath(document, path);

  if (kind === "restrict") {
    const operations = !isObject(current)
      ? []
      : Object.keys(current)
          .filter((key) => !key.startsWith("_") && !allowed.includes(key))
          .map((key) => ({
            kind: "unset",
            path: `${path}.${key}`,
            from: current[key],
            to: undefined,
          }));
    return { operations };
  }

  if (kind === "remove") {
    const operations =
      current === undefined || current === null
        ? []
        : [{ kind: "unset", path, from: current, to: undefined }];
    return { operations };
  }

  if (kind === "value") {
    const operations =
      current === value ? [] : [{ kind: "set", path, from: current, to: value }];
    return { operations };
  }

  if (kind === "append") {
    if (!Array.isArray(current)) {
      return { skipped: `${path} v datasetu není pole`, operations: [] };
    }

    const operations = current.some((item) => item?._key === key)
      ? []
      : [{ kind: "insert", path, from: undefined, to: value }];
    return { operations };
  }

  return { operations: localeOperations(path, current, value) };
};

// --- Výpis -----------------------------------------------------------------

/** Limit je dost vysoký, ať jsou v náhledu vidět i celé odstavce sekcí. */
const PREVIEW_LIMIT = 320;

const preview = (value) => {
  if (value === undefined) return "(nic)";
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return text.length > PREVIEW_LIMIT
    ? `${text.slice(0, PREVIEW_LIMIT - 1)}…`
    : text;
};

const printOperation = (operation) => {
  if (operation.kind === "unset") {
    console.log(`  - ${operation.path}`);
    console.log(`      smaže: ${preview(operation.from)}`);
    return;
  }

  if (operation.kind === "insert") {
    console.log(`  + ${operation.path} (nová položka)`);
    console.log(`      přidá: ${preview(operation.to)}`);
    return;
  }

  console.log(`  ${operation.from === undefined ? "+" : "~"} ${operation.path}`);
  if (operation.from !== undefined) {
    console.log(`      z: ${preview(operation.from)}`);
  }
  console.log(`      na: ${preview(operation.to)}`);
};

// --- Běh -------------------------------------------------------------------

const fetchDocuments = async () => {
  try {
    const result = await client.fetch(
      `{
        "gallery": *[_type == "galleryItem"]{_id, category, caption},
        "siteCopy": *[_id == $siteCopy][0]{
          _id, story, garden, tour, gallery, trips, pricing, contact
        },
        "accommodation": *[_id == $accommodation][0]{
          _id, introText, facts, amenities
        },
        "trips": *[_id in $trips]{_id, summary}
      }`,
      {
        siteCopy: SITE_COPY_ID,
        accommodation: ACCOMMODATION_ID,
        trips: TRIP_SUMMARY_IDS.map((id) => `trip-text-${id}`),
      },
    );

    return new Map(
      [...result.gallery, ...result.trips, result.siteCopy, result.accommodation]
        .filter(Boolean)
        .map((document) => [document._id, document]),
    );
  } catch (error) {
    throw new Error(
      `Nepodařilo se načíst dataset ${projectId}/${dataset}: ${error.message}`,
    );
  }
};

const applyOperations = async (documentId, operations) => {
  const values = Object.fromEntries(
    operations
      .filter(({ kind }) => kind === "set")
      .map(({ path, to }) => [path, to]),
  );
  const removed = operations
    .filter(({ kind }) => kind === "unset")
    .map(({ path }) => path);
  const inserted = operations.filter(({ kind }) => kind === "insert");

  try {
    const patch = client.patch(documentId);
    const withValues =
      Object.keys(values).length > 0 ? patch.set(values) : patch;
    const withRemoved =
      removed.length > 0 ? withValues.unset(removed) : withValues;
    // Nové položky jdou na konec pole, aby pořadí odpovídalo fallback JSONům.
    const withInserted = inserted.reduce(
      (current, { path, to }) => current.insert("after", `${path}[-1]`, [to]),
      withRemoved,
    );

    await withInserted.commit();
  } catch (error) {
    throw new Error(`Zápis do ${documentId} selhal: ${error.message}`);
  }
};

async function main() {
  if (write && !token) {
    throw new Error(
      "zápis vyžaduje SANITY_API_WRITE_TOKEN s právem zápisu " +
        "(studio/.env.local). Náhled bez --write token nepotřebuje.",
    );
  }

  const requirements = buildRequirements();
  const documents = await fetchDocuments();

  console.log(`Dataset ${projectId}/${dataset}`);
  console.log(
    write
      ? "Režim ZÁPIS - změny níže se rovnou ukládají.\n"
      : "Režim NÁHLED - nic se nezapisuje, zápis spustíte s --write.\n",
  );

  const plan = [...new Set(requirements.map(({ document }) => document))].map(
    (documentId) => {
      const document = documents.get(documentId);
      const mine = requirements.filter((item) => item.document === documentId);

      if (!document) {
        return {
          documentId,
          missing: true,
          operations: [],
          skipped: [],
          matched: 0,
        };
      }

      const results = mine.map((item) => toOperations(item, document));

      return {
        documentId,
        missing: false,
        operations: results.flatMap(({ operations }) => operations),
        skipped: results
          .filter(({ skipped }) => skipped)
          .map(({ skipped }) => skipped),
        matched: results.filter(
          ({ operations, skipped }) => operations.length === 0 && !skipped,
        ).length,
      };
    },
  );

  // Varování jdou nahoru a všechna najednou, ať se neztratí mezi změnami.
  const warnings = plan.flatMap((entry) => [
    ...(entry.missing ? [`${entry.documentId} v datasetu není`] : []),
    ...entry.skipped.map((reason) => `${entry.documentId}: ${reason}`),
  ]);
  for (const warning of warnings) {
    console.log(`! přeskočeno - ${warning}`);
  }
  if (warnings.length > 0) console.log("");

  const touched = plan.filter(({ operations }) => operations.length > 0);

  for (const { documentId, operations } of touched) {
    console.log(documentId);
    operations.forEach(printOperation);

    if (write) {
      await applyOperations(documentId, operations);
    }
  }

  const changed = touched.reduce(
    (total, { operations }) => total + operations.length,
    0,
  );
  const unchanged = plan.reduce((total, entry) => total + entry.matched, 0);

  console.log(
    `\nSouhrn: změněno ${changed} polí v ${touched.length} dokumentech, ` +
      `beze změny ${unchanged} polí` +
      `${warnings.length > 0 ? `, přeskočeno ${warnings.length}` : ""}.`,
  );
  console.log(
    write
      ? "Hotovo, zapsáno."
      : changed > 0
        ? "Nic se nezapsalo. Zápis: npm run sync:content -- --write"
        : "Nic k zápisu, dataset je srovnaný.",
  );
}

try {
  await main();
} catch (error) {
  console.error(`Synchronizace skončila chybou: ${error.message}`);
  process.exitCode = 1;
}
