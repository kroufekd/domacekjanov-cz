import { expect, test } from "@playwright/test";

import { fallbackContent } from "@/lib/content";
import {
  ACCOMMODATION_ID,
  buildEditableGroups,
  buildEditableIndex,
  fieldKey,
  isWritableDocumentId,
  SITE_COPY_ID,
  SITE_SETTINGS_ID,
} from "@/lib/edit/fields";

const groups = buildEditableGroups(fallbackContent.cs);
const index = buildEditableIndex(fallbackContent.cs);

test("panel nabízí všechny sekce webu", () => {
  expect(groups.map((group) => group.id)).toEqual([
    "hero",
    "chrome",
    "story",
    "garden",
    "rooms",
    "gallery",
    "tour",
    "trips",
    "pricing",
    "contact",
    "award",
    "seo",
  ]);
});

test("texty ze Studia se mapují na dokumenty a cesty", () => {
  const title = index.get(fieldKey(SITE_COPY_ID, "garden.title"));
  expect(title?.documentId).toBe(SITE_COPY_ID);
  expect(title?.path).toBe("garden.title");
  expect(title?.localized).toBe(true);
  expect(title?.value).toBe(fallbackContent.cs.copy.garden.title);
});

test("seznamy se rozpadají na jednotlivé položky", () => {
  const first = index.get(fieldKey(SITE_COPY_ID, "rooms.comfort[0]"));
  expect(first?.value).toBe(fallbackContent.cs.copy.rooms.comfort[0]);
  expect(first?.label).toMatch(/1$/);

  const nested = index.get(fieldKey(ACCOMMODATION_ID, "amenities[0].items[0]"));
  expect(nested?.value).toBe(
    fallbackContent.cs.accommodation.amenities[0].items[0],
  );
});

test("hero titulek patří do nastavení webu, ne do textů", () => {
  const hero = index.get(fieldKey(SITE_SETTINGS_ID, "heroTitle"));
  expect(hero?.documentId).toBe(SITE_SETTINGS_ID);
  expect(hero?.value).toBe(fallbackContent.cs.settings.heroTitle);
});

test("telefon a e-mail nejsou přeložené", () => {
  expect(index.get(fieldKey(SITE_SETTINGS_ID, "email"))?.localized).toBe(false);
  expect(index.get(fieldKey(SITE_SETTINGS_ID, "phoneDisplay"))?.localized).toBe(
    false,
  );
  expect(index.get(fieldKey(SITE_SETTINGS_ID, "address"))?.localized).toBe(true);
});

test("do panelu se nedostanou odkazy, obrázky ani čísla", () => {
  const paths = [...index.values()]
    .filter((field) => field.documentId === SITE_SETTINGS_ID)
    .map((field) => field.path);

  expect(paths).not.toContain("matterportUrl");
  expect(paths).not.toContain("calendarUrl");
  expect(paths.some((path) => path.startsWith("heroImage"))).toBe(false);
  expect([...index.values()].every((field) => field.value.length > 0)).toBe(
    true,
  );
});

test("delší texty dostanou víceřádkové pole", () => {
  expect(index.get(fieldKey(SITE_SETTINGS_ID, "heroDescription"))?.type).toBe(
    "block",
  );
  expect(index.get(fieldKey(SITE_COPY_ID, "nav.about"))?.type).toBe("line");
});

test("popisky jsou české, ne názvy klíčů", () => {
  expect(index.get(fieldKey(SITE_COPY_ID, "nav.about"))?.label).toBe(
    "Menu: O domečku",
  );
  expect(index.get(fieldKey(ACCOMMODATION_ID, "rooms[1].title"))?.label).toBe(
    "Název pokoje 2",
  );
});

test("klíče jsou jedinečné", () => {
  const keys = groups.flatMap((group) =>
    group.fields.map((field) => field.key),
  );
  expect(new Set(keys).size).toBe(keys.length);
});

test("zapisovat jde jen do známých dokumentů", () => {
  expect(isWritableDocumentId(SITE_COPY_ID)).toBe(true);
  expect(isWritableDocumentId("rate-summer")).toBe(true);
  expect(isWritableDocumentId("summer")).toBe(false);
  expect(isWritableDocumentId("drafts.siteCopy-main")).toBe(false);
  expect(isWritableDocumentId("rate-../../evil")).toBe(false);
});

test("ceník z repa se do panelu nedostane, protože nemá id z úložiště", () => {
  // Fallbackové sazby mají id "summer", úložiště "rate-summer". Kdyby se
  // neodfiltrovaly, mířil by zápis do neexistující položky.
  const rateFields = [...index.values()].filter(
    (field) => !field.documentId.endsWith("-main"),
  );
  expect(rateFields).toEqual([]);
});

test("titulky se svislítkem mají poznámku, ostatní pole ne", () => {
  expect(index.get(fieldKey(SITE_COPY_ID, "garden.title"))?.hint).toMatch(
    /svislítkem/,
  );
  expect(index.get(fieldKey(ACCOMMODATION_ID, "introTitle"))?.hint).toMatch(
    /svislítkem/,
  );
  expect(
    index.get(fieldKey(SITE_COPY_ID, "garden.cardTitle"))?.hint,
  ).toBeUndefined();
  expect(
    index.get(fieldKey(ACCOMMODATION_ID, "rooms[0].title"))?.hint,
  ).toBeUndefined();
  expect(
    index.get(fieldKey(SITE_SETTINGS_ID, "heroTitle"))?.hint,
  ).toBeUndefined();
});
