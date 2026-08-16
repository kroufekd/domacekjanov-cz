import { revalidatePath } from "next/cache";

import { isLocale, localeHref, locales, type Locale } from "@/i18n";
import { getSiteContent } from "@/lib/content";
import { buildEditableIndex } from "@/lib/edit/fields";
import { requireEditSession } from "@/lib/edit/guard";
import { saveChanges, type ResolvedChange } from "@/lib/store/save";
import { cleanValue } from "@/lib/edit/value";

export const dynamic = "force-dynamic";

/** Víc polí naráz klient v panelu nezmění, a strop drží velikost transakce. */
const MAX_CHANGES = 200;

type RawChange = { readonly key: string; readonly value: unknown };

type ParsedBody =
  | { readonly locale: Locale; readonly changes: readonly RawChange[] }
  | { readonly error: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function parseBody(payload: unknown): ParsedBody {
  if (!isRecord(payload)) return { error: "Neplatný požadavek." };
  if (!isLocale(payload.locale)) return { error: "Neznámý jazyk." };

  const raw = payload.changes;
  if (!Array.isArray(raw) || raw.length === 0) {
    return { error: "Není co ukládat." };
  }
  if (raw.length > MAX_CHANGES) {
    return { error: `Najednou jde uložit nejvýš ${MAX_CHANGES} polí.` };
  }

  const changes = raw.filter(
    (item): item is RawChange => isRecord(item) && typeof item.key === "string",
  );
  if (changes.length !== raw.length) {
    return { error: "Neplatný požadavek." };
  }

  return { locale: payload.locale, changes };
}

/** Seznam povolených polí, nebo `null`, když se obsah nepodaří načíst. */
async function loadIndex(locale: Locale) {
  try {
    return buildEditableIndex(await getSiteContent(locale));
  } catch (error) {
    console.error("Editační režim: nepovedlo se načíst texty.", error);
    return null;
  }
}

/**
 * Uloží změněné texty.
 *
 * Klíče se ověřují proti seznamu odvozenému na serveru - to, co přijde z
 * prohlížeče, je jenom odkaz do něj. Cesta ani dokument se z požadavku
 * nepřebírají.
 */
export async function POST(request: Request): Promise<Response> {
  const guard = await requireEditSession();
  if (!guard.ok) return guard.response;

  const parsed = parseBody(await request.json().catch(() => null));
  if ("error" in parsed) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const { locale, changes } = parsed;

  const index = await loadIndex(locale);
  if (!index) {
    return Response.json(
      { error: "Texty se nepodařilo načíst." },
      { status: 502 },
    );
  }

  const resolved: ResolvedChange[] = [];
  for (const change of changes) {
    const field = index.get(change.key);
    if (!field) {
      return Response.json(
        { error: `Pole "${change.key}" tenhle web nemá.`, key: change.key },
        { status: 400 },
      );
    }

    const value = cleanValue(change.value, field.type);
    if ("error" in value) {
      return Response.json(
        { error: `${field.label}: ${value.error}`, key: change.key },
        { status: 400 },
      );
    }

    // Bez porovnávání s tím, co panel zobrazoval: ta hodnota může být z cache
    // a shoda s ní neznamená, že totéž leží i v CMS. Zápis stejného textu nic
    // nezkazí, zahozená úprava ano.
    resolved.push({ field, value: value.value });
  }

  // Panel si podle odpovědi přepíše pole na znění, které opravdu leží v CMS -
  // uložená hodnota je oříznutá a bez neviditelných znaků, takže se od toho,
  // co klient napsal, může lišit.
  const values = Object.fromEntries(
    resolved.map((change) => [change.field.key, change.value]),
  );

  const outcome = await saveChanges(locale, resolved);
  if ("error" in outcome) {
    return Response.json({ error: outcome.error }, { status: outcome.status });
  }

  // Telefon a e-mail přeložené nejsou, takže se změna promítne do
  // všech jazyků naráz - proto se překreslují všechny tři stránky.
  locales.forEach((item) => revalidatePath(localeHref(item)));

  return Response.json({ saved: outcome.saved, values });
}
