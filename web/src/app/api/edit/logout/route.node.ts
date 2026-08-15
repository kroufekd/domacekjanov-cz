import { cookies } from "next/headers";

import { editModeConfig, notFound } from "@/lib/edit/guard";
import { EDIT_COOKIE } from "@/lib/edit/session";

export const dynamic = "force-dynamic";

/** Odhlášení. Bez session je to prázdná operace, což je v pořádku. */
export async function POST(): Promise<Response> {
  if (!editModeConfig()) return notFound();

  const store = await cookies();
  store.delete(EDIT_COOKIE);

  return Response.json({ active: false });
}
