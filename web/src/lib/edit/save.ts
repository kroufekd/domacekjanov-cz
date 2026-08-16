import { randomUUID } from "node:crypto";

import type { Locale } from "@/i18n/config";
import { applyFieldChange, type SanityDocument } from "@/lib/edit/document-update";
import { isWritableDocumentId, type EditableField } from "@/lib/edit/fields";
import { failed } from "@/lib/edit/patch";
import { createWriteClient } from "@/sanity/write-client";

/**
 * Uložení dávky úprav do Sanity.
 *
 * Všechny dokumenty jdou v jedné transakci - když jedna změna neprojde,
 * neuloží se ani zbytek a klient nekouká na web upravený jen z půlky.
 * Každý dokument nese `ifRevisionId`, takže souběžná úprava ve Studiu skončí
 * hláškou místo tichého přepsání.
 */

export type ResolvedChange = {
  readonly field: EditableField;
  readonly value: string;
};

export type SaveOutcome =
  | { readonly saved: number }
  | { readonly error: string; readonly status: number };

const makeKey = (): string => randomUUID().replace(/-/g, "").slice(0, 12);

/** První úsek cesty; jen ten se posílá zpátky do Sanity. */
const topLevelKey = (path: string): string =>
  path.split(".")[0].replace(/\[\d+\]$/, "");

const groupByDocument = (
  changes: readonly ResolvedChange[],
): Map<string, ResolvedChange[]> =>
  changes.reduce((groups, change) => {
    const current = groups.get(change.field.documentId) ?? [];
    return groups.set(change.field.documentId, [...current, change]);
  }, new Map<string, ResolvedChange[]>());

type DocumentPatch = {
  readonly id: string;
  readonly revision: string;
  readonly payload: Record<string, unknown>;
};

function buildPatch(
  document: SanityDocument,
  changes: readonly ResolvedChange[],
  locale: Locale,
): { readonly patch: DocumentPatch } | { readonly error: string } {
  const revision = document._rev;
  if (typeof revision !== "string") {
    return { error: "Dokument v Sanity nemá revizi, radši neukládám." };
  }

  // Postupné skládání přes `reduce` by tu potřebovalo sjednocený typ s chybou,
  // a `"error" in dokument` by se pletlo s polem, které se tak náhodou jmenuje.
  let next = document;
  for (const change of changes) {
    const outcome = applyFieldChange(
      next,
      change.field,
      locale,
      change.value,
      makeKey,
    );
    if (failed(outcome)) return { error: outcome.error };
    next = outcome.value;
  }

  const payload = Object.fromEntries(
    [...new Set(changes.map((change) => topLevelKey(change.field.path)))].map(
      (key) => [key, next[key]],
    ),
  );

  return { patch: { id: String(document._id), revision, payload } };
}

/**
 * Načte dotčené dokumenty, promítne do nich změny a pošle je jednou
 * transakcí. Vrací počet uložených polí, nebo chybu i s HTTP stavem.
 */
export async function saveChanges(
  token: string,
  locale: Locale,
  changes: readonly ResolvedChange[],
): Promise<SaveOutcome> {
  const grouped = groupByDocument(changes);

  const unknown = [...grouped.keys()].find((id) => !isWritableDocumentId(id));
  if (unknown) {
    return { error: `Dokument "${unknown}" upravovat nelze.`, status: 400 };
  }

  const client = createWriteClient(token);

  try {
    const documents = await client.getDocuments([...grouped.keys()]);

    const patches: DocumentPatch[] = [];
    for (const [index, id] of [...grouped.keys()].entries()) {
      const document = documents[index];
      if (!document) {
        return { error: `Dokument "${id}" v Sanity není.`, status: 404 };
      }

      const built = buildPatch(
        document as SanityDocument,
        grouped.get(id) ?? [],
        locale,
      );
      if ("error" in built) return { error: built.error, status: 400 };

      patches.push(built.patch);
    }

    const transaction = patches.reduce(
      (current, patch) =>
        current.patch(
          client.patch(patch.id).ifRevisionId(patch.revision).set(patch.payload),
        ),
      client.transaction(),
    );

    await transaction.commit({ visibility: "sync" });

    return { saved: changes.length };
  } catch (error) {
    const status =
      typeof error === "object" && error !== null && "statusCode" in error
        ? Number((error as { statusCode: unknown }).statusCode)
        : 0;

    if (status === 409) {
      return {
        error: "Text se mezitím změnil jinde. Načtěte panel znovu.",
        status: 409,
      };
    }

    console.error("Editační režim: zápis do Sanity selhal.", error);
    return { error: "Uložení se nepovedlo.", status: 502 };
  }
}
