/**
 * Odkud web bere texty a fotky.
 *
 * `store` je soubor na připojeném svazku, který spravuje editační panel.
 * `fallback` je znění v repu - používá ho statický export, CI i lokální vývoj.
 */
export type ContentSource = "store" | "fallback";

const contentSources: readonly ContentSource[] = ["store", "fallback"];

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
  // Bez nastavení se čte z repa. Zapisovat se dá jen do svazku, a ten se
  // zapíná vědomě - jinak by web na vývojářském stroji sahal na cizí data.
  if (!value) {
    return "fallback";
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
 * takže vždycky čte z repa.
 *
 * Překlep v `CONTENT_SOURCE` shodí build. Tiché spadnutí zpátky na jiný zdroj
 * by znamenalo, že si CI čte z produkce a nikdo si toho nevšimne.
 */
export function contentSource(env: ContentSourceEnv): ContentSource {
  // Export běží při buildu, kde žádný svazek připojený není.
  return env.STATIC_EXPORT === "true"
    ? "fallback"
    : readContentSource(env.CONTENT_SOURCE);
}

/** Zkratka pro místa, která zajímá jen "čte se výhradně z repa?". */
export const usesFallbackOnly = (env: ContentSourceEnv): boolean =>
  contentSource(env) === "fallback";
