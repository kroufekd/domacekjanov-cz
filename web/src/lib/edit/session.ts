import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * Přihlášení do editačního režimu.
 *
 * Session je jedna podepsaná cookie `<platnost>.<HMAC>`. Na serveru se nic
 * nedrží, takže restart kontejneru nikoho neodhlásí a dvě instance si nemají
 * co synchronizovat. Odhlášení všech naráz se dělá změnou `EDIT_SECRET`.
 */

export const EDIT_COOKIE = "domecek_edit";

/** Jedno odpoledne úprav. Po vypršení se PIN zadává znovu. */
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

const digest = (value: string): Buffer =>
  createHash("sha256").update(value, "utf8").digest();

/**
 * Porovnání v konstantním čase. Přes hash proto, že `timingSafeEqual` chce
 * stejně dlouhé vstupy - jinak by délka PINu šla vyčíst z chybové hlášky.
 */
function safeEqual(left: string, right: string): boolean {
  return timingSafeEqual(digest(left), digest(right));
}

const sign = (secret: string, payload: string): string =>
  createHmac("sha256", secret).update(payload, "utf8").digest("hex");

/** Hodnota cookie pro nově přihlášeného editora. */
export function createSessionValue(secret: string, now: number): string {
  const expiresAt = now + SESSION_TTL_MS;
  return `${expiresAt}.${sign(secret, String(expiresAt))}`;
}

/** Ověří podpis i platnost. Cokoli pochybného je prostě neplatné. */
export function isValidSessionValue(
  secret: string,
  value: string | undefined,
  now: number,
): boolean {
  if (!value) return false;

  const separator = value.indexOf(".");
  if (separator <= 0) return false;

  const expiresRaw = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  if (!signature) return false;

  const expiresAt = Number(expiresRaw);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= now) return false;

  return safeEqual(signature, sign(secret, expiresRaw));
}

/** Porovná zadaný PIN s nastaveným. */
export function matchesPin(pin: string, candidate: unknown): boolean {
  if (typeof candidate !== "string" || candidate.length === 0) return false;
  return safeEqual(candidate, pin);
}

/** Nastavení cookie. `secure` se vypíná jen na lokálním HTTP. */
export function sessionCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  } as const;
}
