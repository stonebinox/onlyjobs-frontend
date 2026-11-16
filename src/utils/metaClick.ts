export interface MetaClickPayload {
  fbclid?: string;
  fbc?: string;
  fbp?: string;
}

interface StoredMetaClick {
  fbclid: string;
  fbc: string;
  capturedAt: number;
}

const KEY = "oj_meta_click";
// In-memory copy so the click survives when localStorage and cookies are both blocked
// (e.g. in-app browsers) for the lifetime of the page session.
let inMemory: StoredMetaClick | null = null;
// True when the last capture could not be read back from localStorage or the cookie.
let memoryOnly = false;
const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_FBCLID = 512;
// fbc/fbp are "fb.1.<ms>.<fbclid>": room for a 512-char fbclid plus prefix.
const MAX_COOKIE = 600;
const TOKEN = /^[A-Za-z0-9._-]+$/;

function validToken(value: unknown, max: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max && TOKEN.test(value);
}

function valid(value: unknown): value is string {
  return validToken(value, MAX_FBCLID);
}

function validCookieValue(value: unknown): value is string {
  return validToken(value, MAX_COOKIE) && value.startsWith("fb.1.");
}

function readCookie(name: string): string | undefined {
  try {
    const match = document.cookie.match(new RegExp("(?:^|;)\\s*" + name + "=([^;]*)"));
    return match ? decodeURIComponent(match[1]) : undefined;
  } catch {
    return undefined;
  }
}

function parseStored(raw: string | null | undefined): StoredMetaClick | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredMetaClick>;
    if (!valid(parsed.fbclid) || !validCookieValue(parsed.fbc)) return null;
    if (typeof parsed.capturedAt !== "number" || !Number.isFinite(parsed.capturedAt)) return null;
    const age = Date.now() - parsed.capturedAt;
    if (age < 0 || age >= TTL_MS) return null;
    return { fbclid: parsed.fbclid, fbc: parsed.fbc, capturedAt: parsed.capturedAt };
  } catch {
    return null;
  }
}

function readPersisted(): StoredMetaClick | null {
  try {
    const fromStorage = parseStored(localStorage.getItem(KEY));
    if (fromStorage) return fromStorage;
  } catch {
    // storage blocked - fall through to the cookie
  }
  return parseStored(readCookie(KEY));
}

function readStored(): StoredMetaClick | null {
  const persisted = readPersisted();
  if (persisted) return persisted;
  // Only trust the in-memory copy when capture could not persist it anywhere; a click
  // that was persisted and later cleared by the user must not be resurrected.
  return memoryOnly && inMemory ? parseStored(JSON.stringify(inMemory)) : null;
}

export function captureMetaClick(): void {
  try {
    if (typeof window === "undefined") return;
    const fbclid = new URLSearchParams(window.location.search).get("fbclid");
    if (!valid(fbclid)) return;
    if (readStored()) return; // keep the first non-expired click

    const capturedAt = Date.now();
    const record: StoredMetaClick = { fbclid, fbc: `fb.1.${capturedAt}.${fbclid}`, capturedAt };
    const serialized = JSON.stringify(record);
    inMemory = record;
    memoryOnly = false;
    try {
      localStorage.setItem(KEY, serialized);
    } catch {
      // ignore - cookie is the fallback
    }
    try {
      document.cookie = `${KEY}=${encodeURIComponent(serialized)}; max-age=${TTL_MS / 1000}; path=/; SameSite=Lax`;
    } catch {
      // ignore
    }
    // Verify by reading back: setItem/cookie writes can fail silently.
    memoryOnly = !readPersisted();
  } catch {
    // never throw
  }
}

export function getMetaClickPayload(): MetaClickPayload | undefined {
  try {
    if (typeof window === "undefined") return undefined;
    const stored = readStored();
    const fbcCookie = readCookie("_fbc");
    const fbpCookie = readCookie("_fbp");

    const payload: MetaClickPayload = {};
    if (stored) payload.fbclid = stored.fbclid;
    const fbc = validCookieValue(fbcCookie) ? fbcCookie : stored?.fbc;
    if (fbc) payload.fbc = fbc;
    if (validCookieValue(fbpCookie)) payload.fbp = fbpCookie;
    return Object.keys(payload).length > 0 ? payload : undefined;
  } catch {
    return undefined;
  }
}
