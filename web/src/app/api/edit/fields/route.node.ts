import { isLocale, type Locale } from "@/i18n/config";
import { getSiteContent } from "@/lib/content";
import { buildEditableGroups } from "@/lib/edit/fields";
import { requireEditSession } from "@/lib/edit/guard";

export const dynamic = "force-dynamic";

/** Jazyk z panelu; cokoli neznámého spadne na češtinu. */
function readLocale(request: Request): Locale {
  const value = new URL(request.url).searchParams.get("locale");
  return isLocale(value) ? value : "cs";
}

/** Seznam upravitelných textů i s hodnotami, které web právě ukazuje. */
export async function GET(request: Request): Promise<Response> {
  const guard = await requireEditSession();
  if (!guard.ok) return guard.response;

  const locale = readLocale(request);

  try {
    const content = await getSiteContent(locale, { fresh: true });

    return Response.json(
      { locale, groups: buildEditableGroups(content) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Editační režim: nepovedlo se načíst texty.", error);
    return Response.json(
      { error: "Texty se nepodařilo načíst." },
      { status: 502 },
    );
  }
}
