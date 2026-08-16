import { cookies } from "next/headers";

import { readEditConfig, type EditConfig } from "@/lib/edit/config";
import { EDIT_COOKIE, isValidSessionValue } from "@/lib/edit/session";
import { contentSource } from "@/lib/content/source";

/**
 * Společná vstupní kontrola pro celé editační API.
 *
 * Vypnutý režim odpovídá 404, ne 403 - kdo nemá co hledat, ať se nedozví ani
 * to, že tu něco je. Zapnout jde jen nad úložištěm na disku: se čtením z repa
 * nebo ze statického exportu by uložení nemělo kam a na stránce by se nikdy
 * nic neukázalo.
 */

export const editModeConfig = (): EditConfig | null =>
  contentSource(process.env, false) === "store"
    ? readEditConfig(process.env)
    : null;

export const notFound = (): Response =>
  Response.json({ error: "Nenalezeno." }, { status: 404 });

export const unauthorized = (): Response =>
  Response.json({ error: "Přihlaste se PINem." }, { status: 401 });

export async function hasEditSession(config: EditConfig): Promise<boolean> {
  const store = await cookies();
  return isValidSessionValue(
    config.secret,
    store.get(EDIT_COOKIE)?.value,
    Date.now(),
  );
}

export type GuardResult =
  | { readonly ok: true; readonly config: EditConfig }
  | { readonly ok: false; readonly response: Response };

/** Vrátí nastavení jen přihlášenému editorovi zapnutého režimu. */
export async function requireEditSession(): Promise<GuardResult> {
  const config = editModeConfig();
  if (!config) return { ok: false, response: notFound() };

  if (!(await hasEditSession(config))) {
    return { ok: false, response: unauthorized() };
  }

  return { ok: true, config };
}

/** Za Traefikem chodí skutečná adresa v `x-forwarded-for`. */
export function clientAddress(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || request.headers.get("x-real-ip")?.trim() || "neznámá";
}

/** Cookie se `secure` jen tam, kde web opravdu běží na HTTPS. */
export function isSecureRequest(request: Request): boolean {
  const forwarded = request.headers.get("x-forwarded-proto");
  if (forwarded) return forwarded.split(",")[0]?.trim() === "https";
  return new URL(request.url).protocol === "https:";
}
