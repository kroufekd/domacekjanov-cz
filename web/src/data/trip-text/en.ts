import type { TripId } from "@/data/trips";
import type { TripText } from "@/types/trips";

import data from "./en.json";

/**
 * Anglické názvy a popisy výletů.
 *
 * České jméno zůstává v titulku i tam, kde k němu přidáváme anglický dovětek -
 * přesně to totiž host uvidí na rozcestníku i v navigaci. Výchozí body proto
 * překládáme jen tam, kde nesou obecné slovo ("u Krásné Lípy").
 */
export const tripTextEn: Readonly<Record<TripId, TripText>> = data;
