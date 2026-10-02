export interface FirstTouch {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referringDomain?: string;
  landingPath?: string;
  firstSeenAt?: string;
}

const LS_KEY = "oj_first_touch";
const COOKIE_NAME = "oj_ft";
const CONTROL_CHARS = /[\x00-\x1F\x7F]/g;

let _inMemory: FirstTouch | null = null;

function sanitizeField(value: string, maxLen: number): string {
  return String(value).trim().replace(CONTROL_CHARS, "").slice(0, maxLen);
}

function parseCookieValue(name: string): string | null {
  try {
    const match = document.cookie.match(
      new RegExp("(?:^|;)\\s*" + name + "=([^;]*)")
    );
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

function persistCookie(name: string, value: string): void {
  try {
    const maxAge = 400 * 24 * 60 * 60;
    document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAge}; path=/; SameSite=Lax`;
  } catch {
    // ignore
  }
}

function buildFirstPartyHostSet(): Set<string> {
  const hosts = new Set<string>();
  try {
    hosts.add(window.location.host);
    const envHosts = process.env.NEXT_PUBLIC_FIRST_PARTY_HOSTS ?? "";
    for (const h of envHosts.split(",")) {
      const trimmed = h.trim();
      if (trimmed) hosts.add(trimmed);
    }
  } catch {
    // ignore
  }
  return hosts;
}

export function captureFirstTouch(): void {
  try {
    if (typeof window === "undefined") return;

    // set-once: check in-memory, then localStorage, then cookie
    if (_inMemory) return;
    try {
      if (localStorage.getItem(LS_KEY)) return;
    } catch {
      // storage blocked; still check cookie
    }
    if (parseCookieValue(COOKIE_NAME)) return;

    const params = new URLSearchParams(window.location.search);
    const firstPartyHosts = buildFirstPartyHostSet();

    const touch: FirstTouch = {};

    const utmSource = params.get("utm_source");
    if (utmSource) touch.utmSource = sanitizeField(utmSource, 200);

    const utmMedium = params.get("utm_medium");
    if (utmMedium) touch.utmMedium = sanitizeField(utmMedium, 200);

    const utmCampaign = params.get("utm_campaign");
    if (utmCampaign) touch.utmCampaign = sanitizeField(utmCampaign, 200);

    const utmContent = params.get("utm_content");
    if (utmContent) touch.utmContent = sanitizeField(utmContent, 200);

    const utmTerm = params.get("utm_term");
    if (utmTerm) touch.utmTerm = sanitizeField(utmTerm, 200);

    try {
      const referrer = document.referrer;
      if (referrer) {
        const referrerUrl = new URL(referrer);
        const hostname = referrerUrl.hostname;
        if (!firstPartyHosts.has(hostname) && !firstPartyHosts.has(referrerUrl.host)) {
          touch.referringDomain = sanitizeField(hostname, 500);
        }
      }
    } catch {
      // invalid referrer URL — omit
    }

    touch.landingPath = sanitizeField(window.location.pathname, 500);
    touch.firstSeenAt = new Date().toISOString();

    const serialized = JSON.stringify(touch);
    _inMemory = touch;

    try {
      localStorage.setItem(LS_KEY, serialized);
    } catch {
      // ignore — in-memory is the fallback
    }
    persistCookie(COOKIE_NAME, serialized);
  } catch {
    // never throw
  }
}

export function getFirstTouch(): FirstTouch | null {
  try {
    if (typeof window === "undefined") return null;

    if (_inMemory) return _inMemory;

    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as FirstTouch;
        _inMemory = parsed;
        return parsed;
      }
    } catch {
      // fall through to cookie
    }

    const cookieVal = parseCookieValue(COOKIE_NAME);
    if (cookieVal) {
      try {
        const parsed = JSON.parse(cookieVal) as FirstTouch;
        _inMemory = parsed;
        return parsed;
      } catch {
        return null;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function buildAttributionPayload(): FirstTouch | undefined {
  try {
    const ft = getFirstTouch();
    if (!ft) return undefined;
    const serialized = JSON.stringify(ft);
    let byteLen: number;
    try {
      byteLen = new TextEncoder().encode(serialized).length;
    } catch {
      byteLen = serialized.length; // ASCII strings: safe approximation
    }
    if (byteLen > 2048) return undefined;
    return ft;
  } catch {
    return undefined;
  }
}
