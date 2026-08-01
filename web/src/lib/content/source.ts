/** Odkud web bere texty a fotky. */
export type ContentSource = "sanity" | "fallback";

const contentSources: readonly ContentSource[] = ["sanity", "fallback"];

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
      `CONTENT_SOURCE musí být "sanity" nebo "fallback", dostal jsem "${value}".`,
    );
  }

  return value as ContentSource;
}

/**
 * Rozhodne, jestli se obsah bere výhradně z repa. Statický export nemá kde
 * revalidovat, CI si nechce sáhnout na živý dataset klienta (jeho editace ve
 * Studiu by jinak mohla shodit testy) a bez project ID není koho se ptát.
 *
 * Překlep v `CONTENT_SOURCE` shodí build. Tiché spadnutí zpátky na Sanity by
 * znamenalo, že si CI čte z produkce a nikdo si toho nevšimne.
 */
export function usesFallbackOnly(
  env: ContentSourceEnv,
  hasSanityConfig: boolean,
): boolean {
  const source = readContentSource(env.CONTENT_SOURCE);

  if (!hasSanityConfig) {
    return true;
  }

  return env.STATIC_EXPORT === "true" || source === "fallback";
}
