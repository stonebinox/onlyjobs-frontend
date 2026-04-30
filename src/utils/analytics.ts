import posthog from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

let initialized = false;

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
  posthog.identify(userId);
};

export const resetAnalyticsUser = (): void => {
  if (!POSTHOG_KEY || typeof window === "undefined") return;
  posthog.reset();
};
