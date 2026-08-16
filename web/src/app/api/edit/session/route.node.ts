import { editModeConfig, hasEditSession, notFound } from "@/lib/edit/guard";

/** Odpověď se nikdy nekešuje - cookie by se jinak vyhodnotila jednou provždy. */
export const dynamic = "force-dynamic";

/** Řekne panelu, jestli je editor přihlášený, nebo má ukázat PIN. */
export async function GET(): Promise<Response> {
  const config = editModeConfig();
  if (!config) return notFound();

  return Response.json(
    { active: await hasEditSession(config) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
