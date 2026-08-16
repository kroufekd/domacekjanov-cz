import { contentTypeFor, isSafeMediaName, readMedia } from "@/lib/store/media";

/**
 * Servírování nahraných fotek ze svazku.
 *
 * Veřejné schválně - fotky jsou na stránce vidět. Jméno chodí z adresy, takže
 * projde jen tvar, který sami zakládáme; nic jiného se ze svazku nevydá.
 *
 * Obsah se nikdy nemění: nahraná fotka dostane vlastní jméno a úprava znamená
 * novou. Proto smí ležet v cache napořád.
 */

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
): Promise<Response> {
  const { name } = await params;

  if (!isSafeMediaName(name)) {
    return new Response("Nenalezeno.", { status: 404 });
  }

  const data = await readMedia(name);
  if (!data) {
    return new Response("Nenalezeno.", { status: 404 });
  }

  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": contentTypeFor(name),
      "Content-Length": String(data.byteLength),
      "Cache-Control": `public, max-age=${ONE_YEAR}, immutable`,
    },
  });
}
