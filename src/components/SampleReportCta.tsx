import { MouseEvent, RefObject, Ref, useEffect, useState } from "react";
import { Box, Button } from "@chakra-ui/react";
import { trackEvent } from "@/utils/analytics";
import { trackPixelEvent } from "@/lib/metaPixel";
import { CONSENT_DISMISSED_EVENT, isConsentBannerShowing } from "@/utils/cookieConsent";

export type CtaPlacement = "top" | "bottom" | "sticky_mobile";

const UTM_CONTENT: Record<CtaPlacement, string> = {
  top: "top-cta",
  bottom: "bottom-cta",
  sticky_mobile: "sticky-mobile",
};

function organicHref(placement: CtaPlacement): string {
  return `/?utm_source=site&utm_medium=sample-report&utm_content=${UTM_CONTENT[placement]}#signup`;
}

// True when neither localStorage nor a first-party cookie can hold the first touch.
// Then first touch lives only in memory and a full-page reload would re-capture our
// own internal UTMs as a false "site" source, so the organic CTA must carry none.
function persistentStorageUnavailable(): boolean {
  let lsOk = false;
  try {
    const k = "oj_probe_ls";
    localStorage.setItem(k, "1");
    lsOk = localStorage.getItem(k) === "1";
    localStorage.removeItem(k);
  } catch {
    lsOk = false;
  }
  if (lsOk) return false;
  let cookieOk = false;
  try {
    document.cookie = "oj_probe_ck=1; path=/; SameSite=Lax";
    cookieOk = /(?:^|;\s*)oj_probe_ck=1(?:;|$)/.test(document.cookie);
    document.cookie = "oj_probe_ck=; max-age=0; path=/; SameSite=Lax";
  } catch {
    cookieOk = false;
  }
  return !cookieOk;
}

// Paid visitors keep their landing query string unchanged so the ad's UTMs and fbclid survive.
function hrefFor(placement: CtaPlacement): string {
  try {
    const search = window.location.search;
    const keys = Array.from(new URLSearchParams(search).keys());
    if (keys.some((k) => k.startsWith("utm_") || k === "fbclid")) {
      return `/${search}#signup`;
    }
  } catch {
    // fall through to the organic form
  }
  if (persistentStorageUnavailable()) return "/#signup";
  return organicHref(placement);
}

function useCtaHref(placement: CtaPlacement): string {
  const [href, setHref] = useState(() => organicHref(placement));
  useEffect(() => {
    setHref(hrefFor(placement));
  }, [placement]);
  return href;
}

function handleClick(placement: CtaPlacement, event: MouseEvent<HTMLElement>): void {
  // The post-mount effect may not have run yet; make sure the browser follows the right href.
  try {
    event.currentTarget.setAttribute("href", hrefFor(placement));
  } catch {
    // fail open: keep whatever href is rendered
  }
  try {
    trackEvent("sample_match_report_cta_click", { placement });
  } catch {
    // tracking must never block navigation
  }
  try {
    trackPixelEvent("Lead", { placement });
  } catch {
    // tracking must never block navigation
  }
}

const LABEL = <>Get my first matches, $2 free &rarr;</>;

// Shared by the sticky bar and the page spacer so the spacer always matches the bar.
export const STICKY_BAR_HEIGHT = "calc(88px + env(safe-area-inset-bottom))";

export function SampleReportCta({
  placement,
  buttonRef,
}: {
  placement: "top" | "bottom";
  buttonRef?: Ref<HTMLAnchorElement>;
}) {
  const href = useCtaHref(placement);
  return (
    <Button
      as="a"
      ref={buttonRef}
      href={href}
      colorScheme="blue"
      size="lg"
      data-testid={`sample-report-cta-${placement}`}
      onClick={(e) => handleClick(placement, e)}
    >
      {LABEL}
    </Button>
  );
}

export function useStickyCtaVisible(
  topRef: RefObject<HTMLElement>,
  bottomRef: RefObject<HTMLElement>
): boolean {
  const [pastTopBeforeBottom, setPastTopBeforeBottom] = useState(false);
  const [consentShowing, setConsentShowing] = useState(false);

  useEffect(() => {
    setConsentShowing(isConsentBannerShowing());
    const onDismiss = () => setConsentShowing(false);
    window.addEventListener(CONSENT_DISMISSED_EVENT, onDismiss);
    return () => window.removeEventListener(CONSENT_DISMISSED_EVENT, onDismiss);
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const top = topRef.current;
    const bottom = bottomRef.current;
    if (!top || !bottom) return;

    // Geometry, not the last isIntersecting value: a one-frame jump from
    // "below the viewport" to "above it" fires no IntersectionObserver callback,
    // so scroll/resize re-read live rects. IO callbacks use the entries' own
    // snapshot rects; the other target falls back to its latest known rect.
    const rects = new Map<Element, { top: number; bottom: number }>();
    const decide = () => {
      const t = rects.get(top);
      const b = rects.get(bottom);
      setPastTopBeforeBottom(!!t && !!b && t.bottom < 0 && b.top > window.innerHeight);
    };
    const readLive = () => {
      for (const el of [top, bottom]) {
        const r = el.getBoundingClientRect();
        // No layout box (e.g. display:none): nothing to judge, keep the last known rect.
        if (r.width === 0 && r.height === 0) continue;
        rects.set(el, { top: r.top, bottom: r.bottom });
      }
      decide();
    };

    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        readLive();
      });
    };

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        rects.set(entry.target, { top: entry.boundingClientRect.top, bottom: entry.boundingClientRect.bottom });
      }
      for (const el of [top, bottom]) {
        if (!rects.has(el)) {
          const r = el.getBoundingClientRect();
          rects.set(el, { top: r.top, bottom: r.bottom });
        }
      }
      decide();
    });
    observer.observe(top);
    observer.observe(bottom);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [topRef, bottomRef]);

  return !consentShowing && pastTopBeforeBottom;
}

export function StickySampleReportCta({ visible }: { visible: boolean }) {
  const href = useCtaHref("sticky_mobile");
  return (
    <Box
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      zIndex={1000}
      display={{ base: visible ? "block" : "none", md: "none" }}
      bg="white"
      borderTopWidth="1px"
      borderColor="gray.200"
      px={4}
      pt={3}
      pb="calc(0.75rem + env(safe-area-inset-bottom))"
      minH={STICKY_BAR_HEIGHT}
    >
      <Button
        as="a"
        href={href}
        colorScheme="blue"
        size="lg"
        w="full"
        aria-hidden
        tabIndex={-1}
        data-testid="sample-report-cta-sticky"
        onClick={(e) => handleClick("sticky_mobile", e)}
      >
        {LABEL}
      </Button>
    </Box>
  );
}
