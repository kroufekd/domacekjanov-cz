import { createClient } from "@sanity/client";

import { apiVersion, dataset, projectId } from "@/sanity/env";

/**
 * Klient se zápisovým tokenem pro editační režim.
 *
 * Na rozdíl od `sanityClient` nechodí přes CDN - před uložením se dokument
 * čte, aby se do něj úprava promítla, a CDN by vracela starší verzi. Token se
 * bere z prostředí a nikdy neopouští server.
 */
export function createWriteClient(token: string) {
  return createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
    perspective: "published",
  });
}
