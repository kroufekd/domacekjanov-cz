import path from "node:path";

/**
 * Kde na disku leží obsah webu.
 *
 * Po odpojení Sanity je zdrojem pravdy soubor na připojeném svazku, ne vzdálené
 * CMS. Adresář se dá přenastavit, aby lokální vývoj nesahal na produkční data a
 * testy si mohly sáhnout do dočasné složky.
 */

export const DEFAULT_DATA_DIR = "/data";

export type StoreEnv = {
  readonly CONTENT_DIR?: string;
  readonly [key: string]: string | undefined;
};

export function dataDir(env: StoreEnv = process.env): string {
  const configured = env.CONTENT_DIR?.trim();
  return configured ? path.resolve(configured) : DEFAULT_DATA_DIR;
}

/** Obsah webu: texty, ceník, popisky fotek. */
export const contentFile = (env?: StoreEnv): string =>
  path.join(dataDir(env), "content.json");

/** Nahrané fotky. Ty v `web/public/images` zůstávají součástí image. */
export const mediaDir = (env?: StoreEnv): string =>
  path.join(dataDir(env), "media");

/**
 * Kopie posledních verzí obsahu. Slouží k ručnímu návratu, když se úprava
 * nepovede a záloha v gitu je starší než dnešek.
 */
export const historyDir = (env?: StoreEnv): string =>
  path.join(dataDir(env), "history");
