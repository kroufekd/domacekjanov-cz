import { timingSafeEqual, createHash } from "node:crypto";
import { readdir } from "node:fs/promises";

import { editModeConfig, notFound } from "@/lib/edit/guard";
import { readStore } from "@/lib/store/content-store";
import { isSafeMediaName } from "@/lib/store/media";
import { mediaDir } from "@/lib/store/paths";

export const dynamic = "force-dynamic";

/**
 * Výdej obsahu pro zálohu do gitu.
 *
 * Zálohu si tahá GitHub Action, ne server ji tlačí. Kontejner tak nemusí mít
 * zápisový přístup do repozitáře - kdyby ho někdo prolomil, nedostane se k
 * historii projektu, jen k obsahu webu, který je stejně veřejný.
 *
 * Ověřuje se sdíleným tajemstvím, ne přihlašovací cookie: Action nemá jak
 * projít PINem.
 */

const digest = (value: string): Buffer =>
  createHash("sha256").update(value, "utf8").digest();

const authorized = (request: Request, secret: string): boolean => {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  return token.length > 0 && timingSafeEqual(digest(token), digest(secret));
};

/** Seznam nahraných fotek, aby si je záloha mohla stáhnout jednu po druhé. */
async function uploadedNames(): Promise<string[]> {
  try {
    const entries = await readdir(mediaDir());
    return entries.filter(isSafeMediaName).sort();
  } catch {
    return [];
  }
}

export async function GET(request: Request): Promise<Response> {
  const config = editModeConfig();
  if (!config) return notFound();

  if (!authorized(request, config.secret)) {
    return Response.json({ error: "Nepovolený přístup." }, { status: 401 });
  }

  return Response.json(
    { content: await readStore(), media: await uploadedNames() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
