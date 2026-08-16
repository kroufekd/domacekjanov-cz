import { expect, test } from "@playwright/test";

import { applyFieldChange } from "@/lib/edit/document-update";
import type { EditableField } from "@/lib/edit/fields";
import { failed, parsePath, setAtPath } from "@/lib/edit/patch";
import { cleanValue } from "@/lib/edit/value";

const key = () => "klic1";

const field = (overrides: Partial<EditableField> = {}): EditableField => ({
  key: "siteCopy-main:garden.title",
  documentId: "siteCopy-main",
  path: "garden.title",
  localized: true,
  type: "line",
  label: "Titulek sekce",
  value: "Zahrada",
  ...overrides,
});

const unwrap = <T,>(outcome: { value: T } | { error: string }): T => {
  if ("error" in outcome) throw new Error(outcome.error);
  return outcome.value;
};

test("cesta se rozebere na klíče a indexy", () => {
  expect(parsePath("rooms[0].title")).toEqual([
    { kind: "key", key: "rooms" },
    { kind: "index", index: 0 },
    { kind: "key", key: "title" },
  ]);
});

test("nesmyslná cesta se odmítne", () => {
  expect(parsePath("")).toBeNull();
  expect(parsePath(".title")).toBeNull();
  expect(parsePath("__proto__.polluted")).toBeNull();
  expect(parsePath("rooms[9999].title")).toBeNull();
  expect(parsePath("rooms[0].tit le")).toBeNull();
  expect(parsePath("rooms['0']")).toBeNull();
  expect(parsePath("a".repeat(300))).toBeNull();
});

test("zápis nemění původní dokument", () => {
  const original = { garden: { title: { cs: "Zahrada" } } };
  const segments = parsePath("garden.title.cs");
  const next = unwrap(
    setAtPath(original, segments ?? [], "Zahrádka", {
      makeKey: key,
      label: "test",
    }),
  );

  expect(original.garden.title.cs).toBe("Zahrada");
  expect(next).toEqual({ garden: { title: { cs: "Zahrádka" } } });
});

test("chybějící objekty po cestě vzniknou", () => {
  const next = unwrap(
    setAtPath({}, parsePath("garden.title.cs") ?? [], "Zahrada", {
      makeKey: key,
      label: "test",
    }),
  );

  expect(next).toEqual({ garden: { title: { cs: "Zahrada" } } });
});

test("nová položka seznamu dostane _key", () => {
  const next = unwrap(
    setAtPath(
      { comfort: [{ _key: "a", cs: "první" }] },
      parsePath("comfort[1].cs") ?? [],
      "druhá",
      { makeKey: key, label: "test" },
    ),
  );

  expect(next).toEqual({
    comfort: [
      { _key: "a", cs: "první" },
      { _key: "klic1", cs: "druhá" },
    ],
  });
});

test("díra uprostřed seznamu se nevyrobí", () => {
  const outcome = setAtPath(
    { comfort: [{ _key: "a", cs: "první" }] },
    parsePath("comfort[4].cs") ?? [],
    "pátá",
    { makeKey: key, label: "Pruh s ikonami" },
  );

  expect(failed(outcome)).toBe(true);
});

test("úprava se zapíše jen do zobrazeného jazyka", () => {
  const document = {
    _id: "siteCopy-main",
    garden: {
      title: { _type: "localeString", cs: "Zahrada", de: "Garten", en: "Garden" },
    },
  };

  const next = unwrap(applyFieldChange(document, field(), "cs", "Zahrádka", key));

  expect(next.garden).toEqual({
    title: {
      _type: "localeString",
      cs: "Zahrádka",
      de: "Garten",
      en: "Garden",
    },
  });
});

test("nepřeložené pole se zapíše jako prostý řetězec", () => {
  const next = unwrap(
    applyFieldChange(
      { _id: "siteSettings-main", email: "stary@example.com" },
      field({
        documentId: "siteSettings-main",
        path: "email",
        localized: false,
        label: "E-mail",
      }),
      "cs",
      "novy@example.com",
      key,
    ),
  );

  expect(next.email).toBe("novy@example.com");
});

test("nový překladový objekt dostane _type podle typu pole", () => {
  const next = unwrap(
    applyFieldChange({ _id: "siteCopy-main" }, field(), "cs", "Zahrada", key),
  );

  expect(next.garden).toEqual({
    title: { cs: "Zahrada", _type: "localeString" },
  });
});

test("existující _type se nepřepíše na jednořádkový", () => {
  const document = {
    _id: "siteCopy-main",
    garden: { title: { _type: "localeText", cs: "Zahrada" } },
  };

  const next = unwrap(applyFieldChange(document, field(), "cs", "Zahrádka", key));

  expect((next.garden as Record<string, Record<string, string>>).title._type).toBe(
    "localeText",
  );
});

test("prázdný text se neuloží, protože by se vrátilo vestavěné znění", () => {
  expect(cleanValue("   ", "line")).toEqual({
    error: "Text nesmí zůstat prázdný.",
  });
});

test("jednořádkové pole si nezalomí řádek", () => {
  expect(cleanValue("první\n\ndruhá", "line")).toEqual({
    value: "první druhá",
  });
});

test("odstavec si zalomení nechá", () => {
  expect(cleanValue(" první\r\ndruhá ", "block")).toEqual({
    value: "první\ndruhá",
  });
});

test("neviditelné znaky z kopírování se odstraní", () => {
  expect(cleanValue("Zahrada\u200B\u0007", "line")).toEqual({
    value: "Zahrada",
  });
});

test("přehnaně dlouhý text se odmítne", () => {
  const outcome = cleanValue("a".repeat(501), "line");
  expect("error" in outcome).toBe(true);
});

test("hodnota musí být text", () => {
  expect(cleanValue(42, "line")).toEqual({ error: "Hodnota musí být text." });
});
