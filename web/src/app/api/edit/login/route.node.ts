import { cookies } from "next/headers";

import {
  clientAddress,
  editModeConfig,
  isSecureRequest,
  notFound,
} from "@/lib/edit/guard";
import { createRateLimiter } from "@/lib/edit/rate-limit";
import {
  EDIT_COOKIE,
  createSessionValue,
  matchesPin,
  sessionCookieOptions,
} from "@/lib/edit/session";

export const dynamic = "force-dynamic";

/**
 * Brzda žije v modulu, takže přežije mezi requesty, ale ne restart procesu.
 * Po restartu se počítadlo vynuluje - útočník by ho ale musel umět vyvolat.
 */
const limiter = createRateLimiter();

const badRequest = (message: string, status = 400): Response =>
  Response.json({ error: message }, { status });

/** Přihlášení heslem. Chyba je schválně jedna a stejná pro všechny důvody. */
export async function POST(request: Request): Promise<Response> {
  const config = editModeConfig();
  if (!config) return notFound();

  const attempt = limiter.check(clientAddress(request), Date.now());
  if (!attempt.allowed) {
    return Response.json(
      { error: "Příliš mnoho pokusů. Zkuste to za chvíli." },
      {
        status: 429,
        headers: { "Retry-After": String(attempt.retryAfterSeconds) },
      },
    );
  }

  const payload: unknown = await request.json().catch(() => null);
  const pin =
    typeof payload === "object" && payload !== null
      ? (payload as Record<string, unknown>).pin
      : undefined;

  if (typeof pin !== "string" || pin.length > 200) {
    return badRequest("Zadejte heslo.");
  }

  if (!matchesPin(config.pin, pin)) {
    console.warn(
      `Editační režim: neúspěšné přihlášení z ${clientAddress(request)}.`,
    );
    return badRequest("Nesprávné heslo.", 401);
  }

  limiter.reset(clientAddress(request));

  const store = await cookies();
  store.set(
    EDIT_COOKIE,
    createSessionValue(config.secret, Date.now()),
    sessionCookieOptions(isSecureRequest(request)),
  );

  return Response.json({ active: true });
}
