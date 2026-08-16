/**
 * České popisky polí pro editační panel.
 *
 * Znění je schválně stejné jako v Sanity Studiu (`studio/schemaTypes/*`), aby
 * klient našel totéž pole pod stejným názvem na obou místech.
 *
 * Stromy dole se při načtení modulu zplošťují na cesty typu `nav.about`.
 * Chybějící popisek není chyba - pole se ukáže s odvozeným názvem, jen méně
 * hezkým.
 */

type LabelTree = { readonly [key: string]: string | LabelTree };

function flatten(tree: LabelTree, prefix = ""): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>(
    (accumulator, [key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return typeof value === "string"
        ? { ...accumulator, [path]: value }
        : { ...accumulator, ...flatten(value, path) };
    },
    {},
  );
}

const SECTION_LABELS = {
  eyebrow: "Malý nadpis nad titulkem",
  title: "Titulek sekce",
  description: "Popis sekce",
} as const;

const copyLabels: LabelTree = {
  nav: {
    about: "Menu: O domečku",
    amenities: "Menu: Vybavení",
    gallery: "Menu: Galerie",
    tour: "Menu: 3D prohlídka",
    pricing: "Menu: Ceník",
    contact: "Menu: Kontakt",
  },
  actions: {
    call: "Tlačítko: Zavolat",
    callOwner: "Tlačítko: Zavolat majiteli",
    datesAndPrices: "Tlačítko: Termíny a ceny",
    lookInside: "Tlačítko: Podívat se dovnitř",
    showOnMap: "Tlačítko: Ukázat na mapě",
    startTour: "Tlačítko: Spustit 3D prohlídku",
    openSeparately: "Tlačítko: Otevřít prohlídku samostatně",
    tourIssue: "Nouzový odkaz při potížích s prohlídkou",
    checkAvailability: "Tlačítko: Zkontrolovat obsazenost",
    exploreHouse: "Odkaz pod úvodní fotkou",
    showAll: "Tlačítko: Zobrazit všechny fotky ({count} = počet)",
    showLess: "Tlačítko: Zobrazit méně",
  },
  hero: {
    metaPlace: "Místo v pozadí",
    metaCoords: "Souřadnice v pozadí",
    badgePrefix: "Text před počtem hostů",
    badgeSuffix: "Text za počtem hostů",
  },
  story: {
    eyebrow: SECTION_LABELS.eyebrow,
    noteAccent: "Ručně psaná poznámka – zvýrazněná část",
    noteRest: "Ručně psaná poznámka – zbytek",
  },
  garden: {
    ...SECTION_LABELS,
    stampTitle: "Nadpis v razítku",
    stampNote: "Text v razítku",
    cardTitle: "Nadpis kartičky",
    cardText: "Text kartičky",
    cardPrice: "Cena na kartičce",
  },
  rooms: {
    ...SECTION_LABELS,
    comfort: "Pruh s ikonami pod vybavením",
  },
  gallery: {
    ...SECTION_LABELS,
    filterLabel: "Popisek filtru",
    categories: {
      vse: "Kategorie: Vše",
      exterier: "Kategorie: Exteriér",
      spolecne: "Kategorie: Společné prostory",
      pokoje: "Kategorie: Pokoje",
    },
    swipeHint: "Nápověda v prohlížeči fotek",
  },
  tour: { ...SECTION_LABELS, teaser: "Text přes náhledovou fotku" },
  trips: SECTION_LABELS,
  pricing: {
    ...SECTION_LABELS,
    notes: "Příplatek pod ceníkem",
    calendarNote: "Poznámka u kalendáře",
  },
  contact: {
    ...SECTION_LABELS,
    phoneLabel: "Popisek telefonu",
    emailLabel: "Popisek e-mailu",
    addressLabel: "Popisek adresy",
  },
  footer: {
    tagline: "Věta pod logem",
    pricingLink: "Odkaz na ceník",
    mapLink: "Odkaz na mapu",
    instagramLink: "Odkaz na Instagram",
    facebookLink: "Odkaz na Facebook",
  },
  award: {
    source: "Zdroj nad známkou",
    plateLabel: "Popisek pod známkou",
    cardTitle: "Nadpis karty v patičce",
    cardSource: "Podtitulek karty v patičce",
    scoreSuffix: "Za známkou na kartě",
    viewerTop: "Záhlaví prohlížeče certifikátu",
    viewerCaption: "Popisek pod certifikátem",
    viewerHint: "Nápověda k listování ročníky",
  },
};

const settingsLabels: LabelTree = {
  heroEyebrow: "Malý nadpis nad titulkem",
  heroTitle: "Hlavní titulek webu",
  heroDescription: "Odstavec pod titulkem",
  description: "Krátký popis domečku",
  seoTitle: "Titulek pro vyhledávače",
  seoDescription: "Popis pro vyhledávače",
  address: "Adresa",
  phoneDisplay: "Telefon, jak se zobrazuje",
  email: "E-mail",
};

const accommodationLabels: LabelTree = {
  introTitle: "Titulek sekce O domečku",
  introText: "Odstavec v sekci O domečku",
  "facts[].value": "Číslo v dlaždici",
  "facts[].label": "Popisek dlaždice",
  "rooms[].title": "Název pokoje",
  "rooms[].description": "Popis pokoje",
  "amenities[].title": "Název skupiny vybavení",
  "amenities[].items": "Položka vybavení",
};

const rateLabels: LabelTree = {
  title: "Název položky ceníku",
  price: "Cena",
  unit: "Za co cena je",
  note: "Poznámka pod cenou",
};

const LABELS: Record<string, Record<string, string>> = {
  copy: flatten(copyLabels),
  settings: flatten(settingsLabels),
  accommodation: flatten(accommodationLabels),
  rate: flatten(rateLabels),
};

/** Poslední srozumitelný kousek cesty, kdyby popisek chyběl. */
function humanize(path: string): string {
  const leaf = path.split(".").at(-1) ?? path;
  const withoutIndex = leaf.replace(/\[\d+\]$/, "");
  const spaced = withoutIndex.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Poslední index v cestě - podle něj se pole čísluje v panelu. */
function lastIndex(path: string): number | null {
  const matches = [...path.matchAll(/\[(\d+)\]/g)];
  const last = matches.at(-1);
  return last ? Number(last[1]) : null;
}

/**
 * Tvary cesty, pod kterými se popisek hledá:
 * `rooms[2].title` → `rooms[].title`, `rooms.comfort[0]` → `rooms.comfort`.
 * Seznam řetězců je totiž v tabulce popsaný jednou pro celý seznam.
 */
function lookupKeys(path: string): string[] {
  const generic = path.replace(/\[\d+\]/g, "[]");
  const withoutTrailing = path
    .replace(/\[\d+\]$/, "")
    .replace(/\[\d+\]/g, "[]");

  return [...new Set([path, generic, withoutTrailing])];
}

/**
 * Popisek pole. Pořadové číslo se připojuje na konec, takže z `rooms[2].title`
 * je "Název pokoje 3".
 */
export function fieldLabel(scope: string, path: string): string {
  const table = LABELS[scope] ?? {};
  const template = lookupKeys(path)
    .map((key) => table[key])
    .find(Boolean);

  const base = template ?? humanize(path);
  const index = lastIndex(path);

  return index === null ? base : `${base} ${index + 1}`;
}
