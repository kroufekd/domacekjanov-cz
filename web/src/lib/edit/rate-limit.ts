/**
 * Brzda na hádání PINu.
 *
 * Počítá se dvakrát: podle IP a globálně. Samotný limit na IP nestačí -
 * útočník s pár adresami by jinak dostal pět pokusů na každou z nich. Globální
 * strop je proto vyšší, ale je.
 *
 * Stav žije v paměti procesu. Na jednom kontejneru za Traefikem to sedí; kdyby
 * web někdy běžel ve víc instancích, limit se dělí mezi ně a je volnější.
 */

export type Attempt = {
  readonly count: number;
  readonly resetAt: number;
};

export type RateLimitState = ReadonlyMap<string, Attempt>;

export type RateLimitRule = {
  readonly max: number;
  readonly windowMs: number;
};

export const PER_IP: RateLimitRule = { max: 5, windowMs: 15 * 60 * 1000 };
export const GLOBAL: RateLimitRule = { max: 30, windowMs: 15 * 60 * 1000 };

/** Aby si podvržené `X-Forwarded-For` nenafouklo mapu do nekonečna. */
const MAX_TRACKED = 5_000;

export type RateLimitResult = {
  readonly state: RateLimitState;
  readonly allowed: boolean;
  readonly retryAfterSeconds: number;
};

/** Vyhodí prošlé záznamy a případný přebytek s nejbližším koncem okna. */
function prune(state: RateLimitState, now: number): Map<string, Attempt> {
  const live = [...state].filter(([, attempt]) => attempt.resetAt > now);
  if (live.length <= MAX_TRACKED) return new Map(live);

  const kept = [...live]
    .sort(([, a], [, b]) => b.resetAt - a.resetAt)
    .slice(0, MAX_TRACKED);

  return new Map(kept);
}

/**
 * Zaznamená pokus a řekne, jestli smí projít. Vrací nový stav, původní zůstává
 * nedotčený.
 */
export function recordAttempt(
  state: RateLimitState,
  key: string,
  rule: RateLimitRule,
  now: number,
): RateLimitResult {
  const pruned = prune(state, now);
  const current = pruned.get(key);

  const attempt: Attempt =
    current && current.resetAt > now
      ? { count: current.count + 1, resetAt: current.resetAt }
      : { count: 1, resetAt: now + rule.windowMs };

  pruned.set(key, attempt);

  return {
    state: pruned,
    allowed: attempt.count <= rule.max,
    retryAfterSeconds: Math.max(1, Math.ceil((attempt.resetAt - now) / 1000)),
  };
}

/** Po úspěšném přihlášení se počítadlo té IP zahazuje. */
export function forget(state: RateLimitState, key: string): RateLimitState {
  const next = new Map(state);
  next.delete(key);
  return next;
}

/**
 * Držák stavu pro route handler. Mutace je schválně schovaná sem, aby zbytek
 * modulu zůstal čistě funkční a testovatelný.
 */
export function createRateLimiter() {
  let state: RateLimitState = new Map();

  return {
    check(ip: string, now: number): RateLimitResult {
      const global = recordAttempt(state, "*", GLOBAL, now);
      const perIp = recordAttempt(global.state, ip, PER_IP, now);
      state = perIp.state;

      return global.allowed
        ? perIp
        : { ...global, allowed: false };
    },
    reset(ip: string): void {
      state = forget(state, ip);
    },
  };
}
