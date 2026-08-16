import { expect, test } from "@playwright/test";

import { localeFromPathname } from "@/i18n/config";

/**
 * Jazyk v editační dílně se bere z adresy, na které stojí rám s náhledem -
 * jazyk se totiž přepíná uvnitř rámu, ne v adrese pod ním.
 */

test("kořen je čeština", () => {
  expect(localeFromPathname("/")).toBe("cs");
});

test("jazyk se pozná z první části cesty", () => {
  expect(localeFromPathname("/de")).toBe("de");
  expect(localeFromPathname("/en")).toBe("en");
});

test("koncové lomítko na jazyk nemá vliv", () => {
  expect(localeFromPathname("/de/")).toBe("de");
});

test("neznámá cesta spadne na češtinu", () => {
  expect(localeFromPathname("/vylety")).toBe("cs");
  expect(localeFromPathname("")).toBe("cs");
});
