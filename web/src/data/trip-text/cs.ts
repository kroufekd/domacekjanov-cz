import type { TripId } from "@/data/trips";
import type { TripText } from "@/types/trips";

import data from "./cs.json";

/**
 * České názvy a popisy výletů - výchozí jazyk webu.
 *
 * Wording žije v JSONu, aby ho beze změny přečetl i seed Studia
 * (`studio/scripts/seed.mjs`) a dataset startoval se všemi třemi překlady.
 * Přiřazení níže soubor typově zkontroluje proti `TripText`.
 */
export const tripTextCs: Readonly<Record<TripId, TripText>> = data;
