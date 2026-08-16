import type { LocaleContentText } from "@/lib/content/text/types";

import data from "./cs.json";

/**
 * Kept as JSON so the content seed carries exactly the same wording
 * without a second copy of the translations. The assignment below type-checks
 * the file against `LocaleContentText`.
 */
export const csText: LocaleContentText = data;
