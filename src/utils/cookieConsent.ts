export const CONSENT_KEY = "oj_cookie_consent";
export const CONSENT_DISMISSED_EVENT = "oj:cookie-consent-dismissed";

// Only consulted when storage is unreadable: keeps the banner and sticky bar in
// agreement after a dismissal whose write failed.
let dismissedThisSession = false;

export function isConsentBannerShowing(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return !localStorage.getItem(CONSENT_KEY);
  } catch {
    // Cannot know consent, so the banner shows until dismissed this page session.
    return !dismissedThisSession;
  }
}

export function recordConsentDismissed(): void {
  dismissedThisSession = true;
  try {
    localStorage.setItem(CONSENT_KEY, "1");
  } catch {
    // Storage unavailable: still hidden for this page session.
  }
  window.dispatchEvent(new Event(CONSENT_DISMISSED_EVENT));
}
