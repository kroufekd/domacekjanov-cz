/**
 * Nastavení editačního režimu.
 *
 * Režim je zapnutý jen tehdy, když prostředí nese všechny tři hodnoty naráz.
 * Chybí-li kterákoli z nich, celé API se tváří jako neexistující - web bez
 * PINu, bez podpisového klíče nebo bez zápisového tokenu nemá co pouštět
 * dovnitř. Slabý PIN nebo krátký klíč režim taky nezapnou: tichý provoz s
 * čtyřmístným PINem je horší než vypnutá funkce, o které se ví.
 */

export type EditConfig = {
  readonly pin: string;
  readonly secret: string;
  readonly writeToken: string;
};

export type EditEnv = {
  readonly EDIT_PIN?: string;
  readonly EDIT_SECRET?: string;
  readonly SANITY_API_WRITE_TOKEN?: string;
  readonly [key: string]: string | undefined;
};

/** Osm číslic uhádne skript za chvíli, šest je spodní mez i tak. */
export const MIN_PIN_LENGTH = 6;

/** `openssl rand -hex 32` dá 64 znaků, míň nemá smysl podepisovat. */
export const MIN_SECRET_LENGTH = 32;

type ConfigProblem = { readonly reason: string };

const missing = (env: EditEnv): ConfigProblem | null => {
  const absent = (
    ["EDIT_PIN", "EDIT_SECRET", "SANITY_API_WRITE_TOKEN"] as const
  ).filter((key) => !env[key]?.trim());

  return absent.length > 0
    ? { reason: `chybí ${absent.join(", ")}` }
    : null;
};

/**
 * Vrátí nastavení, nebo `null`, když je režim vypnutý. Důvod jde do
 * serverového logu jen tehdy, když je něco nastavené napůl - úplně prázdné
 * prostředí je normální stav (lokální vývoj, CI, statický export).
 */
export function readEditConfig(env: EditEnv): EditConfig | null {
  const pin = env.EDIT_PIN?.trim() ?? "";
  const secret = env.EDIT_SECRET?.trim() ?? "";
  const writeToken = env.SANITY_API_WRITE_TOKEN?.trim() ?? "";

  const gap = missing(env);
  if (gap) {
    if (pin || secret || writeToken) {
      console.error(`Editační režim zůstal vypnutý: ${gap.reason}.`);
    }
    return null;
  }

  if (pin.length < MIN_PIN_LENGTH) {
    console.error(
      `Editační režim zůstal vypnutý: EDIT_PIN musí mít aspoň ${MIN_PIN_LENGTH} znaků.`,
    );
    return null;
  }

  if (secret.length < MIN_SECRET_LENGTH) {
    console.error(
      `Editační režim zůstal vypnutý: EDIT_SECRET musí mít aspoň ${MIN_SECRET_LENGTH} znaků.`,
    );
    return null;
  }

  return { pin, secret, writeToken };
}
