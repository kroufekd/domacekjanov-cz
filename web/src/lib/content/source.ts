/**
 * Odkud web bere texty a fotky.
 *
 * `store` je soubor na připojeném svazku, který spravuje editační panel;
 * `sanity` je původní CMS a `fallback` znamená číst výhradně z repa.
 */
export type ContentSource = "sanity" | "store" | "fallback";

const contentSources: readonly ContentSource[] = ["sanity", "store", "fallback"];

/**
 * Ta část `process.env`, na které rozhodnutí stojí. Index signature je tu, aby
 * šlo předat rovnou `process.env`, pojmenované klíče kvůli našeptávání.
 */
export type ContentSourceEnv = {
  readonly STATIC_EXPORT?: string;
  readonly CONTENT_SOURCE?: string;
  readonly [key: string]: string | undefined;
};

function readContentSource(value: string | undefined): ContentSource {
  if (!value) {
    return "sanity";
  }

  if (!contentSources.includes(value as ContentSource)) {
    throw new Error(
      `CONTENT_SOURCE musí být ${contentSources
        .map((item) => `"${item}"`)
        .join(", ")}, dostal jsem "${value}".`,
    );
  }

  return value as ContentSource;
}

/**
 * Odkud se obsah opravdu vezme.
 *
 * Statický export nemá kde revalidovat ani kam sáhnout pro připojený svazek,
 * takže vždycky čte z repa. Bez project ID není koho se ptát na Sanity.
 *
 * Překlep v `CONTENT_SOURCE` shodí build. Tiché spadnutí zpátky na jiný zdroj
 * by znamenalo, že si CI čte z produkce a nikdo si toho nevšimne.
 */
export function contentSource(
  env: ContentSourceEnv,
  hasSanityConfig: boolean,
): ContentSource {
  const requested = readContentSource(env.CONTENT_SOURCE);

  if (env.STATIC_EXPORT === "true") return "fallback";
  if (requested === "sanity" && !hasSanityConfig) return "fallback";

  return requested;
}

/** Zkratka pro místa, která zajímá jen "čte se výhradně z repa?". */
export function usesFallbackOnly(
  env: ContentSourceEnv,
  hasSanityConfig: boolean,
): boolean {
  return contentSource(env, hasSanityConfig) === "fallback";
}
