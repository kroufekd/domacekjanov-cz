import { revalidatePath } from "next/cache";

import { isLocale, localeHref, locales, type Locale } from "@/i18n";
import { requireEditSession } from "@/lib/edit/guard";
import { readStore, updateStore } from "@/lib/store/content-store";
import {
  isCategory,
  isUploaded,
  movePhoto,
  patchPhoto,
  photosOf,
  uniqueId,
  withPhotos,
  type GalleryPhoto,
} from "@/lib/store/gallery";
import {
  MAX_UPLOAD_BYTES,
  removeMedia,
  slugify,
  storeUpload,
} from "@/lib/store/media";

export const dynamic = "force-dynamic";

/**
 * Správa fotek v galerii.
 *
 * Na rozdíl od textů se tady neschovává rozdělaná změna - nahrání, přesun i
 * smazání se ukládají hned. Rozpracovaná fronta operací nad soubory by se dala
 * zahodit jen těžko a klient od správce fotek čeká, že co udělá, to platí.
 */

const ONE_MEGABYTE = 1024 * 1024;

type PhotoView = {
  readonly id: string;
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly alt: string;
  readonly caption: string;
  readonly category: string;
  readonly featured: boolean;
  readonly uploaded: boolean;
};

const view = (photo: GalleryPhoto, locale: Locale): PhotoView => ({
  id: photo.id,
  src: photo.src,
  width: photo.width,
  height: photo.height,
  alt: photo.alt?.[locale] ?? "",
  caption: photo.caption?.[locale] ?? "",
  category: photo.category ?? "exterier",
  featured: photo.featured === true,
  uploaded: isUploaded(photo),
});

const readLocale = (value: unknown): Locale => (isLocale(value) ? value : "cs");

/** Fotky se ukazují ve všech jazycích, takže se překreslují všechny stránky. */
const refresh = () => locales.forEach((item) => revalidatePath(localeHref(item)));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export async function GET(request: Request): Promise<Response> {
  const guard = await requireEditSession();
  if (!guard.ok) return guard.response;

  const locale = readLocale(new URL(request.url).searchParams.get("locale"));
  const photos = photosOf(await readStore());

  return Response.json(
    {
      locale,
      limitMb: Math.round(MAX_UPLOAD_BYTES / ONE_MEGABYTE),
      photos: photos.map((photo) => view(photo, locale)),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/** Nahrání nové fotky na konec galerie. */
export async function POST(request: Request): Promise<Response> {
  const guard = await requireEditSession();
  if (!guard.ok) return guard.response;

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const locale = readLocale(form?.get("locale"));

  if (!(file instanceof File)) {
    return Response.json({ error: "Chybí soubor." }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return Response.json(
      { error: `Fotka je větší než ${MAX_UPLOAD_BYTES / ONE_MEGABYTE} MB.` },
      { status: 413 },
    );
  }

  const data = new Uint8Array(await file.arrayBuffer());
  let added: PhotoView | null = null;

  const outcome = await updateStore(async (store) => {
    const photos = photosOf(store);
    const taken = new Set(
      photos.map((photo) => photo.src.split("/").pop() ?? ""),
    );

    const stored = await storeUpload(data, file.name, (name) => taken.has(name));
    if ("error" in stored) return { error: stored.error };

    const photo: GalleryPhoto = {
      id: uniqueId(photos, slugify(file.name)),
      src: stored.media.url,
      width: stored.media.info.width,
      height: stored.media.info.height,
      category: "exterier",
    };

    added = view(photo, locale);
    return { store: withPhotos(store, [...photos, photo]) };
  });

  if (outcome.error) {
    return Response.json({ error: outcome.error }, { status: 400 });
  }

  refresh();
  return Response.json({ photo: added });
}

/** Úprava popisků a kategorie, nebo posun v pořadí. */
export async function PATCH(request: Request): Promise<Response> {
  const guard = await requireEditSession();
  if (!guard.ok) return guard.response;

  const body: unknown = await request.json().catch(() => null);
  if (!isRecord(body) || typeof body.id !== "string") {
    return Response.json({ error: "Neplatný požadavek." }, { status: 400 });
  }

  const { id } = body;
  const locale = readLocale(body.locale);

  if (body.action === "move") {
    const direction = body.direction === -1 ? -1 : 1;

    const outcome = await updateStore((store) => ({
      store: withPhotos(store, movePhoto(photosOf(store), id, direction)),
    }));

    if (outcome.error) {
      return Response.json({ error: outcome.error }, { status: 400 });
    }

    refresh();
    return Response.json({ moved: true });
  }

  if (body.category !== undefined && !isCategory(body.category)) {
    return Response.json({ error: "Neznámá kategorie." }, { status: 400 });
  }

  const text = (value: unknown): string | undefined =>
    typeof value === "string" ? value.trim().slice(0, 300) : undefined;

  const outcome = await updateStore((store) => {
    const photos = photosOf(store);
    if (!photos.some((photo) => photo.id === id)) {
      return { error: "Taková fotka v galerii není." };
    }

    return {
      store: withPhotos(
        store,
        photos.map((photo) =>
          photo.id === id
            ? patchPhoto(
                photo,
                {
                  alt: text(body.alt),
                  caption: text(body.caption),
                  category: isCategory(body.category) ? body.category : undefined,
                  featured:
                    typeof body.featured === "boolean" ? body.featured : undefined,
                },
                locale,
              )
            : photo,
        ),
      ),
    };
  });

  if (outcome.error) {
    return Response.json({ error: outcome.error }, { status: 400 });
  }

  refresh();
  return Response.json({ updated: true });
}

/** Vyřazení fotky z galerie. Nahraný soubor se zahodí i ze svazku. */
export async function DELETE(request: Request): Promise<Response> {
  const guard = await requireEditSession();
  if (!guard.ok) return guard.response;

  const id = new URL(request.url).searchParams.get("id") ?? "";
  let removed: GalleryPhoto | null = null;

  const outcome = await updateStore((store) => {
    const photos = photosOf(store);
    const target = photos.find((photo) => photo.id === id);

    if (!target) return { error: "Taková fotka v galerii není." };
    if (photos.length <= 1) {
      return { error: "Poslední fotku v galerii smazat nejde." };
    }

    removed = target;
    return {
      store: withPhotos(
        store,
        photos.filter((photo) => photo.id !== id),
      ),
    };
  });

  if (outcome.error) {
    return Response.json({ error: outcome.error }, { status: 400 });
  }

  // Soubor až po uložení seznamu: kdyby zápis selhal, fotka by zmizela z disku
  // a v galerii by zůstal odkaz na nic.
  if (removed) await removeMedia((removed as GalleryPhoto).src);

  refresh();
  return Response.json({ deleted: true });
}
