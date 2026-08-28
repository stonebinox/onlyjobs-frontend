import posthog from "posthog-js";
import type { User } from "@/types/User";
import type { PersonProperties } from "@/utils/analyticsSchema";

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
  if (!POSTHOG_KEY || typeof window === "undefined") return;
  posthog.capture("page_view", { url });
};

export const trackEvent = (event: string, properties?: Record<string, unknown>): void => {
  if (!POSTHOG_KEY || typeof window === "undefined") return;
  posthog.capture(event, properties);
};

export const identifyUser = (userId: string): void => {
  if (!POSTHOG_KEY || typeof window === "undefined") return;
  currentIdentityId = userId;
  posthog.identify(userId);
};

export const resetAnalyticsUser = (): void => {
  if (!POSTHOG_KEY || typeof window === "undefined") return;
  currentIdentityId = null;
  posthog.reset();
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
