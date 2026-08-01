import type { TripId } from "@/data/trips";
import type { TripText } from "@/types/trips";

import data from "./de.json";

/**
 * Německé názvy a popisy výletů.
 *
 * U cílů, které mají zavedený německý název, uvádíme obojí ("Prebischtor
 * (Pravčická brána)") - podle německého jména je host najde v průvodci, podle
 * českého na rozcestníku. Výchozí body zůstávají česky ze stejného důvodu.
 */
export const tripTextDe: Readonly<Record<TripId, TripText>> = data;
