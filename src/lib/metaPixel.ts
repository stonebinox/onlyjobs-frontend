interface FbqStub {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  push: FbqStub;
  loaded: boolean;
  version: string;
  queue: unknown[][];
  disablePushState?: boolean;
}

interface PixelWindow extends Window {
  fbq?: FbqStub;
  _fbq?: FbqStub;
}

const DENIED_PATHS = [
  "/reset-password",
  "/verify-email",
  "/privacy-policy",
  "/terms-conditions",
  "/refund-policy",
];
const FIRED_KEY = "oj_meta_fired";

let initialized = false;
const firedInMemory = new Set<string>();

function pixelId(): string | undefined {
  return process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || undefined;
}

function isDenylisted(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin);
    const path = parsed.pathname.toLowerCase().replace(/\/+$/, "") || "/";
    if (DENIED_PATHS.includes(path)) return true;
    return Array.from(parsed.searchParams.keys()).some((k) => k.toLowerCase() === "token");
  } catch {
    return true; // unparseable URL: fail closed
  }
}

/** Initialises the pixel once, on the first eligible URL. Returns whether it is ready to fire. */
export function ensurePixel(url: string): boolean {
  try {
    const id = pixelId();
    if (!id || typeof window === "undefined") return false;
    if (isDenylisted(url)) return false;
    if (initialized) return true;

    const w = window as PixelWindow;
    if (!w.fbq) {
      const fbq: FbqStub = function (...args: unknown[]) {
        if (fbq.callMethod) fbq.callMethod(...args);
        else fbq.queue.push(args);
      } as FbqStub;
      fbq.push = fbq;
      fbq.loaded = true;
      fbq.version = "2.0";
      fbq.queue = [];
      w.fbq = fbq;
      w._fbq = fbq;

      const script = document.createElement("script");
      script.async = true;
      script.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.appendChild(script);
    }
    w.fbq.disablePushState = true;
    w.fbq("set", "autoConfig", false, id);
    w.fbq("init", id);
    initialized = true;
    return true;
  } catch {
    return false;
  }
}

export function trackPixelPageView(url: string): void {
  try {
    if (!ensurePixel(url)) return;
    (window as PixelWindow).fbq?.("track", "PageView");
  } catch {
    // pixel failures must never break a page
  }
}

function alreadyFired(eventId: string): boolean {
  if (firedInMemory.has(eventId)) return true;
  try {
    const raw = sessionStorage.getItem(FIRED_KEY);
    const ids: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids) && ids.includes(eventId);
  } catch {
    return false;
  }
}

function markFired(eventId: string): void {
  firedInMemory.add(eventId);
  try {
    const raw = sessionStorage.getItem(FIRED_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    const ids = Array.isArray(parsed) ? parsed : [];
    ids.push(eventId);
    sessionStorage.setItem(FIRED_KEY, JSON.stringify(ids));
  } catch {
    // in-memory set still dedups within this page load
  }
}

function fire(
  method: "track" | "trackCustom",
  name: string,
  params: Record<string, unknown>,
  eventId?: string
): void {
  try {
    if (!ensurePixel(window.location.pathname + window.location.search)) return;
    if (eventId && alreadyFired(eventId)) return;
    const fbq = (window as PixelWindow).fbq;
    if (!fbq) return;
    if (eventId) fbq(method, name, params, { eventID: eventId });
    else fbq(method, name, params);
    if (eventId) markFired(eventId);
  } catch {
    // pixel failures must never break a page
  }
}

export function trackPixelEvent(name: string, params: Record<string, unknown> = {}, eventId?: string): void {
  fire("track", name, params, eventId);
}

export function trackPixelCustomEvent(name: string, params: Record<string, unknown> = {}, eventId?: string): void {
  fire("trackCustom", name, params, eventId);
}
