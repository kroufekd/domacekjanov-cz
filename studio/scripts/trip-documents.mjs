import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Dokumenty typu `trip` postavené z týchž JSONů, ze kterých čte web.
 *
 * Sdílí je seed (`seed.mjs`, kompletní bootstrap datasetu) a synchronizace
 * (`sync-trips.mjs`, kterou po každém mergi spouští GitHub Actions). Cesty se
 * počítají od tohohle souboru, ať je jedno, odkud se skript pustí.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const TRIP_TEXT_DIRECTORY = resolve(HERE, "../../web/src/data/trip-text");

/** Jazyky, ve kterých web běží. Čeština je ta, na kterou se padá zpátky. */
export const TRIP_LOCALES = ["cs", "de", "en"];

/** Typ dokumentů, které mapa nahradila. Jejich id se kryjí s novými výlety. */
export const LEGACY_TRIP_TYPE = "tripTip";

const readTripText = (locale) =>
  JSON.parse(
    readFileSync(resolve(TRIP_TEXT_DIRECTORY, `${locale}.json`), "utf8"),
  );

/**
 * Jeden `{cs, de, en}` objekt. Jazyk bez hodnoty se vynechá, ať z chybějícího
 * upozornění nevznikne prázdný řetězec, který by web bral vážně.
 */
const localized = (texts, type, pick) =>
  Object.fromEntries([
    ["_type", type],
    ...TRIP_LOCALES.map((locale) => [locale, pick(texts[locale])]).filter(
      ([, value]) => typeof value === "string" && value.trim(),
    ),
  ]);

/**
 * Texty všech výletů jako dokumenty pro Studio. Geometrie tu není - souřadnice
 * a trasy zůstávají v kódu webu a párují se přes `tripId`.
 */
export function buildTripDocuments() {
  const texts = Object.fromEntries(
    TRIP_LOCALES.map((locale) => [locale, readTripText(locale)]),
  );

  return Object.keys(texts.cs).map((id) => {
    const note = localized(texts, "localeText", (text) => text[id]?.note);

    return {
      // Prefix `trip-text-` schválně: id starých dokumentů `tripTip` vypadala
      // jako `trip-hrensko` a kryla by se s novými. Takhle nemusí synchronizace
      // na produkci nic mazat, aby měla kam zapsat.
      _id: `trip-text-${id}`,
      _type: "trip",
      tripId: id,
      title: localized(texts, "localeString", (text) => text[id]?.title),
      startName: localized(texts, "localeString", (text) => text[id]?.startName),
      summary: localized(texts, "localeText", (text) => text[id]?.summary),
      // Bez uzavírky se pole vynechá, ať Studio neukazuje prázdné upozornění.
      ...(Object.keys(note).length > 1 ? { note } : {}),
    };
  });
}

/**
 * Smaže dokumenty starého typu `tripTip` včetně rozepsaných konceptů. Sekci
 * „Tipy na výlet" web po nasazení mapy přestal vypisovat a schéma pro ni už
 * ve Studiu není, takže v datasetu jen leží.
 *
 * Volá to jen `seed.mjs`, který se spouští ručně. Automatická synchronizace
 * nemaže nic - úklid mrtvého typu za ni nestojí za riziko, že by nasazení
 * sáhlo na produkční data.
 */
export async function deleteLegacyTripTips(client) {
  const ids = await client.fetch(`*[_type == $type]._id`, {
    type: LEGACY_TRIP_TYPE,
  });

  for (const id of ids) {
    await client.delete(id);
  }

  return ids.length;
}
