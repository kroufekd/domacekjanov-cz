import { expect, test } from "@playwright/test";

import { readEditConfig } from "@/lib/edit/config";
import {
  createRateLimiter,
  recordAttempt,
  PER_IP,
} from "@/lib/edit/rate-limit";
import {
  createSessionValue,
  isValidSessionValue,
  matchesPin,
  SESSION_TTL_MS,
} from "@/lib/edit/session";

const SECRET = "0".repeat(64);

const complete = {
  EDIT_PIN: "12345678",
  EDIT_SECRET: SECRET,
};

test("bez proměnných je editační režim vypnutý", () => {
  expect(readEditConfig({})).toBeNull();
});

test("chybějící podpisový klíč režim nezapne", () => {
  expect(readEditConfig({ EDIT_PIN: "12345678" })).toBeNull();
});

test("krátký PIN režim nezapne", () => {
  expect(readEditConfig({ ...complete, EDIT_PIN: "1234" })).toBeNull();
});

test("krátký podpisový klíč režim nezapne", () => {
  expect(readEditConfig({ ...complete, EDIT_SECRET: "kratky" })).toBeNull();
});

test("prázdné hodnoty se berou jako nenastaveno", () => {
  expect(readEditConfig({ ...complete, EDIT_PIN: "   " })).toBeNull();
});

test("kompletní nastavení režim zapne a hodnoty ořízne", () => {
  expect(readEditConfig({ ...complete, EDIT_PIN: " 12345678 " })).toEqual({
    pin: "12345678",
    secret: SECRET,
  });
});

test("podepsaná session projde, cizí podpis ne", () => {
  const now = 1_700_000_000_000;
  const value = createSessionValue(SECRET, now);

  expect(isValidSessionValue(SECRET, value, now + 1_000)).toBe(true);
  expect(isValidSessionValue("1".repeat(64), value, now + 1_000)).toBe(false);
});

test("session po osmi hodinách vyprší", () => {
  const now = 1_700_000_000_000;
  const value = createSessionValue(SECRET, now);

  expect(isValidSessionValue(SECRET, value, now + SESSION_TTL_MS - 1)).toBe(
    true,
  );
  expect(isValidSessionValue(SECRET, value, now + SESSION_TTL_MS + 1)).toBe(
    false,
  );
});

test("podvržená platnost bez podpisu neprojde", () => {
  const now = 1_700_000_000_000;
  const forged = `${now + SESSION_TTL_MS}.abcdef`;

  expect(isValidSessionValue(SECRET, forged, now)).toBe(false);
  expect(isValidSessionValue(SECRET, "", now)).toBe(false);
  expect(isValidSessionValue(SECRET, undefined, now)).toBe(false);
  expect(isValidSessionValue(SECRET, "bez-tecky", now)).toBe(false);
});

test("PIN se porovnává na přesnou shodu", () => {
  expect(matchesPin("12345678", "12345678")).toBe(true);
  expect(matchesPin("12345678", "1234567")).toBe(false);
  expect(matchesPin("12345678", "")).toBe(false);
  expect(matchesPin("12345678", 12345678)).toBe(false);
});

test("po pěti pokusech z jedné adresy se brzdí", () => {
  const now = 1_700_000_000_000;
  const attempts = Array.from({ length: 6 }, (_, index) => index);

  const results = attempts.reduce<{
    state: ReturnType<typeof recordAttempt>["state"];
    allowed: boolean[];
  }>(
    (current, _, index) => {
      const outcome = recordAttempt(current.state, "1.2.3.4", PER_IP, now + index);
      return {
        state: outcome.state,
        allowed: [...current.allowed, outcome.allowed],
      };
    },
    { state: new Map(), allowed: [] },
  );

  expect(results.allowed).toEqual([true, true, true, true, true, false]);
});

test("po vypršení okna se počítadlo rozjede znovu", () => {
  const now = 1_700_000_000_000;
  const first = recordAttempt(new Map(), "1.2.3.4", PER_IP, now);
  const later = recordAttempt(
    first.state,
    "1.2.3.4",
    PER_IP,
    now + PER_IP.windowMs + 1,
  );

  expect(later.allowed).toBe(true);
});

test("úspěšné přihlášení počítadlo té adresy vynuluje", () => {
  const limiter = createRateLimiter();
  const now = 1_700_000_000_000;

  Array.from({ length: 5 }).forEach(() => limiter.check("1.2.3.4", now));
  expect(limiter.check("1.2.3.4", now).allowed).toBe(false);

  limiter.reset("1.2.3.4");
  expect(limiter.check("1.2.3.4", now).allowed).toBe(true);
});

test("střídání adres nabourá globální strop", () => {
  const limiter = createRateLimiter();
  const now = 1_700_000_000_000;

  const outcomes = Array.from({ length: 31 }, (_, index) =>
    limiter.check(`10.0.0.${index}`, now),
  );

  expect(outcomes.slice(0, 30).every((item) => item.allowed)).toBe(true);
  expect(outcomes[30].allowed).toBe(false);
});
