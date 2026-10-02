import posthog from "posthog-js";
import type { User } from "@/types/User";
import type { PersonProperties } from "@/utils/analyticsSchema";
import type { FirstTouch } from "@/utils/attribution";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

let initialized = false;
let currentIdentityId: string | null = null;

export const initAnalytics = (): void => {
  if (initialized || !POSTHOG_KEY || typeof window === "undefined") return;
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false, // we fire page_view manually via router events
    loaded: () => {
      initialized = true;
    },
  });
  initialized = true;
};

export const trackPageView = (url: string): void => {
  try {
    if (!POSTHOG_KEY || typeof window === "undefined") return;
    posthog.capture("page_view", { url });
  } catch {
    // fail-open
  }
};

export const trackEvent = (event: string, properties?: Record<string, unknown>): void => {
  try {
    if (!POSTHOG_KEY || typeof window === "undefined") return;
    posthog.capture(event, properties);
  } catch {
    // fail-open
  }
};

export const identifyUser = (userId: string): void => {
  try {
    if (!POSTHOG_KEY || typeof window === "undefined") return;
    currentIdentityId = userId;
    posthog.identify(userId);
  } catch {
    // fail-open
  }
};

export const resetAnalyticsUser = (): void => {
  try {
    if (!POSTHOG_KEY || typeof window === "undefined") return;
    currentIdentityId = null;
    posthog.reset();
  } catch {
    // fail-open
  }
};

export const setFirstTouchPersonPropertiesOnce = (ft: FirstTouch): void => {
  try {
    if (!POSTHOG_KEY || typeof window === "undefined") return;
    const setOnce: Record<string, string | undefined> = {
      initial_utm_source: ft.utmSource,
      initial_utm_medium: ft.utmMedium,
      initial_utm_campaign: ft.utmCampaign,
      initial_utm_content: ft.utmContent,
      initial_utm_term: ft.utmTerm,
      initial_referring_domain: ft.referringDomain,
      initial_landing_path: ft.landingPath,
      initial_source: (ft.utmSource || ft.utmMedium || ft.utmCampaign || ft.utmContent || ft.utmTerm)
        ? "utm"
        : ft.referringDomain
        ? "referral"
        : "direct",
    };
    // Remove undefined values before sending
    const filtered: Record<string, string> = {};
    for (const [k, v] of Object.entries(setOnce)) {
      if (v !== undefined) filtered[k] = v;
    }
    posthog.setPersonProperties(undefined, filtered);
  } catch {
    // fail-open
  }
};

export const setUserPersonProperties = (user: User): void => {
  if (!POSTHOG_KEY || typeof window === "undefined") return;
  if (currentIdentityId === null || user.id !== currentIdentityId) return;
  const props: PersonProperties = {
    is_verified: !!user.isVerified,
    has_resume: user.resume != null,
  };
  if (user.preferences != null) {
    props.matching_enabled = user.preferences.matchingEnabled;
    props.min_score = user.preferences.minScore;
  }
  posthog.setPersonProperties(props);
};
