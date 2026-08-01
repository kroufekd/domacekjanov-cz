import { createClient } from "@sanity/client";

import { buildTripDocuments } from "./trip-documents.mjs";

/**
 * Doplní do datasetu výlety, které v něm ještě nejsou.
 *
 * Spouští se po každém mergi do masteru (GitHub Actions), takže musí být
 * bezpečná na produkci. Proto umí jedinou operaci: `createIfNotExists`.
 * Nic nepřepisuje, nic nemaže - co majitel napsal ve Studiu, žádné nasazení
 * nepřemaže, a nový výlet přidaný v kódu se ve Studiu objeví sám.
 *
 * Na rozdíl od `seed.mjs`, který dataset staví od nuly přes `createOrReplace`
 * a patří výhradně do prázdného projektu.
 */

const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  throw new Error("Chybí SANITY_API_WRITE_TOKEN s právem zápisu.");
}

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || "lli7g5ge",
  dataset: process.env.SANITY_STUDIO_DATASET || "production",
  apiVersion: "2026-07-24",
  token,
  useCdn: false,
});

const documents = buildTripDocuments();
const existing = new Set(await client.fetch(`*[_type == "trip"]._id`));
const missing = documents.filter((document) => !existing.has(document._id));

for (const document of missing) {
  await client.createIfNotExists(document);
  console.log(`+ ${document.tripId}`);
}

console.log(
  missing.length > 0
    ? `Hotovo. Přidáno ${missing.length} z ${documents.length} výletů, zbytek v datasetu už byl a zůstal beze změny.`
    : `Hotovo. Všech ${documents.length} výletů už v datasetu je, nezapisovalo se nic.`,
);
