import type { StructureResolver } from "sanity/structure";

/**
 * Three singletons carry the whole website, the rest are ordinary lists.
 * The document ids match the ones written by `scripts/seed.mjs`.
 */
export const singletons = [
  { id: "siteSettings-main", type: "siteSettings", title: "Nastavení webu" },
  { id: "siteCopy-main", type: "siteCopy", title: "Texty webu" },
  {
    id: "accommodation-main",
    type: "accommodation",
    title: "Domeček a vybavení",
  },
] as const;

export const singletonTypes: ReadonlySet<string> = new Set(
  singletons.map((item) => item.type),
);

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Domeček Janov")
    .items([
      ...singletons.map((item) =>
        S.listItem()
          .id(item.id)
          .title(item.title)
          .child(
            S.document()
              .schemaType(item.type)
              .documentId(item.id)
              .title(item.title),
          ),
      ),
      S.divider(),
      S.documentTypeListItem("galleryItem").title("Fotografie"),
      S.documentTypeListItem("rate").title("Ceny"),
      S.documentTypeListItem("trip").title("Výlety na mapě"),
    ]);
