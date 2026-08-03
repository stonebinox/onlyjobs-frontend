/**
 * ADVERSARIAL TEST — onlyjobs-drq: No-match not-red + centralize verdict colours
 *
 * Assume the implementation is subtly WRONG; write tests that EXPOSE bugs.
 * Report pass/fail — failures are FINDINGS, not fixes.
 * Do NOT modify production code, do NOT weaken tests.
 *
 * FORBIDDEN files (not opened):
 *   src/utils/verdict-colors.ts
 *   src/utils/__tests__/verdict-colors.test.ts
 *
 * CONTRACT (oracle — all expected values derive from the spec, never from running the code):
 *   getVerdictColor("Strong match") → { hex: "#1B7A4B", colorScheme: "green"  }
 *   getVerdictColor("Mild match")   → { hex: "#8A6D1F", colorScheme: "yellow" }
 *   getVerdictColor("Weak match")   → { hex: "#6B7280", colorScheme: "gray"   }
 *   getVerdictColor("No match")     → { hex: "#6B7280", colorScheme: "gray"  }
 *   getVerdictColor(<unknown>)      → { hex: "#6B7280", colorScheme: "gray"  }
 *
 *   INVARIANT (highest priority): NO verdict ever returns hex="#EF4444" or colorScheme="red"
 *
 *   COMPONENT — BriefEntry: verdict badge for "No match" uses colorScheme gray, NOT red
 *   COMPONENT — MatchScoreRing: "No match" uses LOCAL noneGradient (grey), NOT a red gradient;
 *     the local VERDICT_RING_CONFIG map must be grey — this is the drift risk.
 *   REGRESSION — theme.colors.semantic.error === "#EF4444" (error red must survive;
 *     only the verdict red was removed)
 *
 * DISCLOSURE: see bottom of file.
 */

// ── Mocks (hoisted before any import) ─────────────────────────────────────────

jest.mock('@emotion/react', () => ({
  keyframes: () => 'mock-keyframes',
  css: (...args: any[]) => args,
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock('@/lib/apiClient', () => ({
  __esModule: true,
  createApiClient: jest.fn(() => ({
    markMatchClick: jest.fn().mockResolvedValue({}),
    markMatchAsSkipped: jest.fn().mockResolvedValue({}),
  })),
}));

jest.mock('@/utils/analytics', () => ({
  trackEvent: jest.fn(),
  initAnalytics: jest.fn(),
  trackPageView: jest.fn(),
  identifyUser: jest.fn(),
}));

jest.mock('@/utils/brief-utils', () => ({
  getOddsLine: () => 'Apply while fresh — posted recently',
  getOddsColor: () => '#6B7280',
  isSafeUrl: () => true,
}));

jest.mock('@/utils/text-formatter', () => ({
  numberFormatter: (n: number) => String(n),
}));

/**
 * Chakra mock — SVG-aware.
 *
 * Box: when `as` is an SVG element, passes through SVG presentation attributes so the
 * rendered DOM has real SVG structure (gradients, circles, stroke refs). For non-SVG
 * elements the Chakra layout props are silently dropped.
 *
 * Badge: renders as <span data-colorscheme={colorScheme}> so tests can inspect which
 * colorScheme the verdict badge was given.
 */
jest.mock('@chakra-ui/react', () => {
  const React = require('react');

  const SVG_TAGS = new Set(['svg', 'circle', 'defs', 'linearGradient', 'stop', 'g', 'rect', 'path']);
  const SVG_ATTRS = new Set([
    'cx', 'cy', 'r', 'fill', 'stroke', 'strokeWidth', 'strokeLinecap',
    'strokeDasharray', 'strokeDashoffset', 'viewBox', 'width', 'height',
    'x1', 'y1', 'x2', 'y2', 'id', 'offset', 'stopColor',
  ]);

  const Box = React.forwardRef(
    ({ as: Tag = 'div', children, animation, ...rest }: any, ref: any) => {
      const isSvg = SVG_TAGS.has(Tag);
      const passedProps = isSvg
        ? Object.fromEntries(Object.entries(rest).filter(([k]) => SVG_ATTRS.has(k)))
        : {};
      return React.createElement(Tag, { ref, ...passedProps }, children);
    }
  );
  Box.displayName = 'Box';

  const Badge = ({ colorScheme, bg, color, children }: any) =>
    React.createElement('span', {
      'data-colorscheme': colorScheme ?? 'none',
      'data-bg': bg ?? '',
      'data-color': color ?? '',
      'data-testid': 'chakra-badge',
    }, children);
  Badge.displayName = 'Badge';

  const el = (tag: string) => {
    const C = ({ children }: any) => React.createElement(tag, {}, children);
    C.displayName = tag;
    return C;
  };

  return {
    __esModule: true,
    Box,
    Badge,
    VStack: el('div'),
    HStack: el('div'),
    Flex: el('div'),
    Text: el('span'),
    Heading: el('h2'),
    Button: el('button'),
    Wrap: el('div'),
    WrapItem: el('div'),
    Textarea: el('textarea'),
    Alert: el('div'),
    AlertIcon: () => null,
    AlertDescription: el('span'),
    Modal: el('div'),
    ModalOverlay: () => null,
    ModalContent: el('div'),
    ModalHeader: el('div'),
    ModalBody: el('div'),
    ModalFooter: el('div'),
    ModalCloseButton: () => null,
    Drawer: el('div'),
    DrawerOverlay: () => null,
    DrawerContent: el('div'),
    DrawerHeader: el('div'),
    DrawerBody: el('div'),
    DrawerCloseButton: () => null,
    useDisclosure: () => ({ isOpen: false, onOpen: jest.fn(), onClose: jest.fn() }),
    useToast: () => jest.fn(),
    ChakraProvider: ({ children }: any) => React.createElement(React.Fragment, null, children),
    extendTheme: (t: any) => t,
  };
});

// ── Imports (after all jest.mock calls) ───────────────────────────────────────

import React from 'react';
import { render } from '@testing-library/react';
import { getVerdictColor } from '@/utils/verdict-colors';
import { BriefEntry } from '@/components/Today/BriefEntry';
import { MatchScoreRing } from '@/components/Dashboard/MatchScoreRing';
import theme from '@/theme/theme';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const NO_MATCH_ENTRY = {
  _id: 'match-adversarial-001',
  userId: 'user-test',
  jobId: 'job-adversarial-001',
  matchScore: 12,
  verdict: 'No match',
  reasoning: 'Skills and background do not align with this role.',
  clicked: false,
  skipped: false,
  applied: false,
  createdAt: '2026-01-15T10:00:00.000Z',
  updatedAt: '2026-01-15T10:00:00.000Z',
  job: {
    _id: 'job-adversarial-001',
    title: 'Senior Blockchain Engineer',
    company: 'CryptoFarm Ltd',
    location: ['Remote'],
    salary: { min: 80000, max: 120000, currency: 'USD', estimated: false },
    tags: ['blockchain', 'solidity'],
    source: 'linkedin',
    description: 'Build smart contracts for our DeFi protocol.',
    postedDate: '2026-01-10T00:00:00.000Z',
    scrapedDate: '2026-01-11T00:00:00.000Z',
    url: 'https://example.com/job/adversarial-001',
    createdAt: '2026-01-10T00:00:00.000Z',
    updatedAt: '2026-01-10T00:00:00.000Z',
  },
};

const RED_HEX_VALUES = ['#EF4444', '#ef4444', '#DC2626', '#dc2626', '#B91C1C', '#b91c1c', '#991B1B'];

// ══════════════════════════════════════════════════════════════════════════════
// SECTION A — getVerdictColor: correct return values for all four canonical verdicts
// ══════════════════════════════════════════════════════════════════════════════

describe('A — getVerdictColor: canonical verdicts return correct shapes', () => {

  it('A-1: returns an object with { hex, colorScheme } keys (shape contract)', () => {
    const result = getVerdictColor('Strong match');
    expect(result).toHaveProperty('hex');
    expect(result).toHaveProperty('colorScheme');
    expect(typeof result.hex).toBe('string');
    expect(typeof result.colorScheme).toBe('string');
  });

  it('A-2: "Strong match" → hex #1B7A4B', () => {
    expect(getVerdictColor('Strong match').hex).toBe('#1B7A4B');
  });

  it('A-3: "Strong match" → colorScheme "green"', () => {
    expect(getVerdictColor('Strong match').colorScheme).toBe('green');
  });

  it('A-4: "Mild match" → hex #8A6D1F', () => {
    expect(getVerdictColor('Mild match').hex).toBe('#8A6D1F');
  });

  it('A-5: "Mild match" → colorScheme "yellow"', () => {
    expect(getVerdictColor('Mild match').colorScheme).toBe('yellow');
  });

  it('A-6: "Weak match" → hex #6B7280', () => {
    expect(getVerdictColor('Weak match').hex).toBe('#6B7280');
  });

  it('A-7: "Weak match" → colorScheme "gray"', () => {
    expect(getVerdictColor('Weak match').colorScheme).toBe('gray');
  });

  it('A-8: "No match" → hex #6B7280 [THE TARGET CASE — was red before this task]', () => {
    // FINDING if "#EF4444": the old red value was not changed
    // FINDING if "#000000" or "": implementation returned empty/wrong fallback
    expect(getVerdictColor('No match').hex).toBe('#6B7280');
  });

  it('A-9: "No match" → colorScheme "gray" [not "red", not "grey"]', () => {
    // FINDING if "red": the colorScheme was not updated
    // FINDING if "grey": British spelling — Chakra uses "gray" (American)
    const cs = getVerdictColor('No match').colorScheme;
    expect(cs).toBe('gray');
    expect(cs).not.toBe('red');
    expect(cs).not.toBe('grey');
  });

  it('A-10: "No match" hex is exactly 7 chars including #', () => {
    const hex = getVerdictColor('No match').hex;
    expect(hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('A-11: Strong/Mild/No-match return 3 distinct hex families (Weak and No match share Quiet grey)', () => {
    const hexes = [
      getVerdictColor('Strong match').hex,
      getVerdictColor('Mild match').hex,
      getVerdictColor('Weak match').hex,
      getVerdictColor('No match').hex,
    ];
    const unique = new Set(hexes);
    // Weak match and No match both map to Quiet grey (#6B7280) by design
    expect(unique.size).toBe(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SECTION B — getVerdictColor: fallback for unknown / empty / undefined inputs
// ══════════════════════════════════════════════════════════════════════════════

describe('B — getVerdictColor: unknown inputs fall back to grey', () => {

  it('B-1: empty string → hex #6B7280 (grey fallback)', () => {
    expect(getVerdictColor('').hex).toBe('#6B7280');
  });

  it('B-2: empty string → colorScheme "gray"', () => {
    expect(getVerdictColor('').colorScheme).toBe('gray');
  });

  it('B-3: undefined (cast) → hex #6B7280', () => {
    expect(getVerdictColor(undefined as any).hex).toBe('#6B7280');
  });

  it('B-4: undefined (cast) → colorScheme "gray"', () => {
    expect(getVerdictColor(undefined as any).colorScheme).toBe('gray');
  });

  it('B-5: null (cast) → hex #6B7280', () => {
    expect(getVerdictColor(null as any).hex).toBe('#6B7280');
  });

  it('B-6: null (cast) → colorScheme "gray"', () => {
    expect(getVerdictColor(null as any).colorScheme).toBe('gray');
  });

  it('B-7: random unknown string "GREAT FIT" → grey fallback', () => {
    expect(getVerdictColor('GREAT FIT').hex).toBe('#6B7280');
    expect(getVerdictColor('GREAT FIT').colorScheme).toBe('gray');
  });

  it('B-8: "no match" (all lowercase) → grey fallback (exact case required)', () => {
    // "No match" is the canonical form; "no match" is unknown → fallback
    expect(getVerdictColor('no match').hex).toBe('#6B7280');
    expect(getVerdictColor('no match').colorScheme).toBe('gray');
  });

  it('B-9: "No Match" (capital M) → grey fallback (exact case required)', () => {
    expect(getVerdictColor('No Match').hex).toBe('#6B7280');
    expect(getVerdictColor('No Match').colorScheme).toBe('gray');
  });

  it('B-10: "Strong Match" (capital M) → grey fallback (not aliased to canonical)', () => {
    expect(getVerdictColor('Strong Match').hex).toBe('#6B7280');
  });

  it('B-11: whitespace-padded " No match " → grey fallback (exact string only)', () => {
    expect(getVerdictColor(' No match ').hex).toBe('#6B7280');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SECTION C — INVARIANT: no verdict ever returns red hex or red colorScheme
//
// This is the highest-priority contract assertion. Before this task, "No match"
// returned #EF4444/red. These tests would have FAILED then; they must pass now.
// ══════════════════════════════════════════════════════════════════════════════

describe('C — INVARIANT: zero verdicts may return red hex or red colorScheme', () => {

  const ALL_VERDICTS = ['Strong match', 'Mild match', 'Weak match', 'No match'];
  const UNKNOWN_INPUTS = ['', 'GREAT FIT', 'Poor fit', 'no match', 'No Match', 'unknown'];

  it('C-1: "No match" hex is NOT any shade of red [PRIMARY INVARIANT]', () => {
    const { hex } = getVerdictColor('No match');
    for (const red of RED_HEX_VALUES) {
      expect(hex.toLowerCase()).not.toBe(red.toLowerCase());
    }
  });

  it('C-2: "No match" colorScheme is NOT "red" [PRIMARY INVARIANT]', () => {
    expect(getVerdictColor('No match').colorScheme).not.toBe('red');
  });

  it('C-3: "Strong match" hex is not red (green only)', () => {
    const { hex } = getVerdictColor('Strong match');
    for (const red of RED_HEX_VALUES) {
      expect(hex.toLowerCase()).not.toBe(red.toLowerCase());
    }
  });

  it('C-4: "Mild match" hex is not red (amber/gold only)', () => {
    const { hex } = getVerdictColor('Mild match');
    for (const red of RED_HEX_VALUES) {
      expect(hex.toLowerCase()).not.toBe(red.toLowerCase());
    }
  });

  it('C-5: "Weak match" hex is not red (grey only)', () => {
    const { hex } = getVerdictColor('Weak match');
    for (const red of RED_HEX_VALUES) {
      expect(hex.toLowerCase()).not.toBe(red.toLowerCase());
    }
  });

  it('C-6: exhaustive — no canonical verdict returns hex #EF4444', () => {
    for (const verdict of ALL_VERDICTS) {
      expect(getVerdictColor(verdict).hex.toLowerCase()).not.toBe('#ef4444');
    }
  });

  it('C-7: exhaustive — no canonical verdict returns hex #DC2626', () => {
    for (const verdict of ALL_VERDICTS) {
      expect(getVerdictColor(verdict).hex.toLowerCase()).not.toBe('#dc2626');
    }
  });

  it('C-8: exhaustive — no canonical verdict returns colorScheme "red"', () => {
    for (const verdict of ALL_VERDICTS) {
      expect(getVerdictColor(verdict).colorScheme).not.toBe('red');
    }
  });

  it('C-9: unknown inputs never return red hex', () => {
    for (const input of UNKNOWN_INPUTS) {
      const { hex } = getVerdictColor(input);
      for (const red of RED_HEX_VALUES) {
        expect(hex.toLowerCase()).not.toBe(red.toLowerCase());
      }
    }
  });

  it('C-10: unknown inputs never return colorScheme "red"', () => {
    for (const input of UNKNOWN_INPUTS) {
      expect(getVerdictColor(input).colorScheme).not.toBe('red');
    }
  });

  it('C-11: "No match" hex is in the grey family (#6B7280 or nearby grey)', () => {
    const { hex } = getVerdictColor('No match');
    // The spec says exactly #6B7280. Anything that is NOT grey is a finding.
    expect(hex).toBe('#6B7280');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SECTION D — BriefEntry component: "No match" renders a grey verdict badge
//
// BriefEntry calls getVerdictColor(verdict).colorScheme and passes it to the
// Chakra Badge. Our mock captures this as data-colorscheme so we can inspect it.
// ══════════════════════════════════════════════════════════════════════════════

describe('D — BriefEntry: "No match" renders grey verdict badge, never red', () => {

  let container: HTMLElement;

  beforeEach(() => {
    const result = render(
      <BriefEntry
        entry={NO_MATCH_ENTRY as any}
        onSkipped={jest.fn()}
      />
    );
    container = result.container;
  });

  it('D-1: renders without crashing for "No match" verdict', () => {
    expect(container).toBeTruthy();
  });

  it('D-2: renders at least one Badge (the verdict chip)', () => {
    const badges = container.querySelectorAll('[data-testid="chakra-badge"]');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('D-3: the verdict badge uses exact editor bg/text for "No match" [CORE ASSERTION — not Chakra default]', () => {
    // FINDING if data-bg="" or data-bg="#38A169": still using colorScheme="gray" (Chakra default, not exact hex)
    // "No match" → badgeBg #F3F4F6, badgeText #4B5563
    const badge = container.querySelector('[data-bg="#F3F4F6"]');
    expect(badge).not.toBeNull();
    expect(badge!.getAttribute('data-color')).toBe('#4B5563');
  });

  it('D-4: verdict badge text contains "No match"', () => {
    const badge = container.querySelector('[data-bg="#F3F4F6"]');
    expect(badge).not.toBeNull();
    expect(badge!.textContent).toContain('No match');
  });

  it('D-5: no Badge on the page uses a red background [INVARIANT at component level]', () => {
    // FINDING if any badge has data-bg="#EF4444": a verdict-related red badge is on screen
    const redBadges = container.querySelectorAll('[data-bg="#EF4444"]');
    expect(redBadges.length).toBe(0);
  });

  it('D-6: verdict badge text contains the match score (12)', () => {
    const badge = container.querySelector('[data-bg="#F3F4F6"]');
    expect(badge!.textContent).toContain('12');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SECTION E — MatchScoreRing: "No match" uses grey LOCAL config, never red
//
// MatchScoreRing has its OWN VERDICT_RING_CONFIG map in addition to the shared
// getVerdictColor helper. The drift risk: someone updates getVerdictColor to grey
// but forgets to update VERDICT_RING_CONFIG. These tests verify the LOCAL map
// is also grey by inspecting the rendered SVG structure.
// ══════════════════════════════════════════════════════════════════════════════

describe('E — MatchScoreRing: "No match" uses grey local ring config, never red', () => {

  let container: HTMLElement;

  beforeEach(() => {
    const result = render(<MatchScoreRing score={12} verdict="No match" size="md" />);
    container = result.container;
  });

  it('E-1: renders without crashing', () => {
    expect(container).toBeTruthy();
  });

  it('E-2: the verdict Badge uses exact editor bg/text for "No match" [not Chakra default]', () => {
    // FINDING if data-bg="" or Chakra grey: colorScheme path still used
    // "No match" → badgeBg #F3F4F6, badgeText #4B5563
    const badge = container.querySelector('[data-bg="#F3F4F6"]');
    expect(badge).not.toBeNull();
    expect(badge!.getAttribute('data-color')).toBe('#4B5563');
  });

  it('E-3: no Badge uses a red background [invariant at component level]', () => {
    const redBadges = container.querySelectorAll('[data-bg="#EF4444"]');
    expect(redBadges.length).toBe(0);
  });

  it('E-4: the noneGradient linearGradient is present in the SVG', () => {
    // FINDING if null: VERDICT_RING_CONFIG["No match"].gradientId was changed away from "noneGradient"
    const noneGradient = container.querySelector('#noneGradient');
    expect(noneGradient).not.toBeNull();
  });

  it('E-5: noneGradient stop-0% is grey (#6B7280), NOT red [LOCAL MAP assertion]', () => {
    // FINDING if #EF4444: the LOCAL ring config still has a red gradient for No match
    const noneGradient = container.querySelector('#noneGradient');
    expect(noneGradient).not.toBeNull();
    const stops = noneGradient!.querySelectorAll('stop');
    expect(stops.length).toBeGreaterThanOrEqual(1);
    // stopColor in JSX becomes stop-color in DOM via React SVG handling
    const firstStopColor =
      stops[0].getAttribute('stop-color') ??
      stops[0].getAttribute('stopColor') ??
      '';
    expect(firstStopColor.toLowerCase()).not.toBe('#ef4444');
    expect(firstStopColor.toLowerCase()).not.toBe('#dc2626');
    // It must be a grey-family value
    expect(firstStopColor.toLowerCase()).toBe('#6b7280');
  });

  it('E-6: noneGradient stop-100% is grey (#4B5563), NOT red [LOCAL MAP assertion]', () => {
    const noneGradient = container.querySelector('#noneGradient');
    const stops = noneGradient!.querySelectorAll('stop');
    expect(stops.length).toBeGreaterThanOrEqual(2);
    const lastStopColor =
      stops[stops.length - 1].getAttribute('stop-color') ??
      stops[stops.length - 1].getAttribute('stopColor') ??
      '';
    expect(lastStopColor.toLowerCase()).not.toBe('#ef4444');
    expect(lastStopColor.toLowerCase()).not.toBe('#dc2626');
    expect(lastStopColor.toLowerCase()).toBe('#4b5563');
  });

  it('E-7: the progress circle stroke references the noneGradient (not a red gradient)', () => {
    // FINDING if stroke="url(#redGradient)" or if the element is missing: LOCAL config drifted
    const progressCircle = container.querySelector('circle[stroke="url(#noneGradient)"]');
    expect(progressCircle).not.toBeNull();
  });

  it('E-8: no SVG gradient stop uses red hex (#EF4444) [all four gradients checked]', () => {
    // The four gradients always render; none of their stops should be red.
    // FINDING if contains #EF4444: a gradient (likely noneGradient) was left with red
    const svgContent = container.innerHTML;
    expect(svgContent.toLowerCase()).not.toContain('#ef4444');
    expect(svgContent.toLowerCase()).not.toContain('#dc2626');
  });

  it('E-9: the progress circle stroke does NOT reference a red gradient', () => {
    const allCircles = container.querySelectorAll('circle');
    const strokeValues = Array.from(allCircles).map(c => c.getAttribute('stroke') ?? '');
    // None of the stroke refs should be to a gradient that starts with "red"
    for (const stroke of strokeValues) {
      expect(stroke.toLowerCase()).not.toContain('red');
      expect(stroke.toLowerCase()).not.toBe('#ef4444');
      expect(stroke.toLowerCase()).not.toBe('#dc2626');
    }
  });

  it('E-10: badge text shows the verdict "No match"', () => {
    const badge = container.querySelector('[data-bg="#F3F4F6"]');
    expect(badge!.textContent).toContain('No match');
  });

  it('E-11: score text "12" is present in the rendered output', () => {
    expect(container.textContent).toContain('12');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SECTION F — Theme regression: semantic.error remains red, match.none is grey
//
// The task removed verdict-red usage. Collateral damage risk: someone deleted the
// semantic.error token too. Assert it survived. Also assert match.none is grey.
// ══════════════════════════════════════════════════════════════════════════════

describe('F — Theme regression: semantic.error preserved, match.none is grey', () => {

  it('F-1: theme.colors.semantic.error === "#EF4444" [error red must survive]', () => {
    // FINDING if undefined: the semantic.error token was accidentally removed
    // FINDING if "#6B7280": the error was changed to grey (catastrophic — errors look neutral)
    expect((theme as any).colors.semantic.error).toBe('#EF4444');
  });

  it('F-2: theme.colors.match.none === "#6B7280" [No-match colour is grey in theme too]', () => {
    // FINDING if "#EF4444": match.none in theme was not updated to match the shared helper
    expect((theme as any).colors.match.none).toBe('#6B7280');
  });

  it('F-3: match.none is NOT equal to semantic.error (grey ≠ red)', () => {
    // FINDING if equal: the theme accidentally aliases no-match with error colour
    const none = (theme as any).colors.match.none;
    const error = (theme as any).colors.semantic.error;
    expect(none).not.toBe(error);
  });

  it('F-4: semantic.error is a red hex value (not accidentally changed to another hue)', () => {
    const error: string = (theme as any).colors.semantic.error ?? '';
    // Red hues start with #E..., #D..., #B..., #9... — asserting the specific known value
    expect(error).toMatch(/^#[EeDdBb9][Ff0-9A-Fa-f]{5}$/);
    expect(error.toUpperCase()).toBe('#EF4444');
  });

  it('F-5: match.strong, match.mild, match.weak are also not red', () => {
    const colors = (theme as any).colors.match;
    for (const [key, val] of Object.entries(colors)) {
      const hex = (val as string).toUpperCase();
      expect(hex).not.toBe('#EF4444');
      expect(hex).not.toBe('#DC2626');
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SECTION G — Exact editor-colour rendered-DOM assertions for all four verdicts
//
// These are RENDERED assertions, not helper-output checks (Codex finding).
// Each verdict's badge bg/text must match the design-spec hex, NOT a Chakra
// default (e.g. Chakra "green" badge would be ~#38A169, not Strong #1B7A4B).
//
// Design spec (from VERDICT_COLORS):
//   Strong match: badgeBg #D1FAE5, badgeText #145C37
//   Mild match:   badgeBg #FEF3C7, badgeText #6B4E15
//   Weak match:   badgeBg #F3F4F6, badgeText #4B5563
//   No match:     badgeBg #F3F4F6, badgeText #4B5563
// ══════════════════════════════════════════════════════════════════════════════

const makeEntry = (verdict: string, score: number) => ({
  _id: `match-g-${verdict}`,
  userId: 'user-test',
  jobId: `job-g-${verdict}`,
  matchScore: score,
  verdict,
  reasoning: `Test reasoning for ${verdict}.`,
  clicked: false,
  skipped: false,
  applied: false,
  createdAt: '2026-01-15T10:00:00.000Z',
  updatedAt: '2026-01-15T10:00:00.000Z',
  job: {
    _id: `job-g-${verdict}`,
    title: 'Test Role',
    company: 'Test Co',
    location: ['Remote'],
    salary: { min: 100000, max: 150000, currency: 'USD', estimated: false },
    tags: [],
    source: 'linkedin',
    description: 'Test description.',
    postedDate: '2026-01-10T00:00:00.000Z',
    scrapedDate: '2026-01-11T00:00:00.000Z',
    url: 'https://example.com/job/test',
    createdAt: '2026-01-10T00:00:00.000Z',
    updatedAt: '2026-01-10T00:00:00.000Z',
  },
});

describe('G — BriefEntry: rendered verdict badge uses EXACT editor hex, not Chakra default', () => {
  it('G-1: "Strong match" badge bg is #D1FAE5 (design spec tint), NOT Chakra green (~#38A169)', () => {
    const { container } = render(
      <BriefEntry entry={makeEntry('Strong match', 88) as any} onSkipped={jest.fn()} />
    );
    const badge = container.querySelector('[data-bg="#D1FAE5"]');
    expect(badge).not.toBeNull();
  });

  it('G-2: "Strong match" badge text colour is #145C37 (deep Strong green)', () => {
    const { container } = render(
      <BriefEntry entry={makeEntry('Strong match', 88) as any} onSkipped={jest.fn()} />
    );
    const badge = container.querySelector('[data-bg="#D1FAE5"]');
    expect(badge!.getAttribute('data-color')).toBe('#145C37');
  });

  it('G-3: "Strong match" badge text colour is NOT Chakra default green (~#38A169)', () => {
    const { container } = render(
      <BriefEntry entry={makeEntry('Strong match', 88) as any} onSkipped={jest.fn()} />
    );
    const chakraGreenBadge = container.querySelector('[data-color="#38A169"]');
    expect(chakraGreenBadge).toBeNull();
  });

  it('G-4: "Mild match" badge bg is #FEF3C7 (design spec tint), NOT Chakra yellow (~#D69E2E)', () => {
    const { container } = render(
      <BriefEntry entry={makeEntry('Mild match', 55) as any} onSkipped={jest.fn()} />
    );
    const badge = container.querySelector('[data-bg="#FEF3C7"]');
    expect(badge).not.toBeNull();
  });

  it('G-5: "Mild match" badge text colour is #6B4E15 (deep Look gold)', () => {
    const { container } = render(
      <BriefEntry entry={makeEntry('Mild match', 55) as any} onSkipped={jest.fn()} />
    );
    const badge = container.querySelector('[data-bg="#FEF3C7"]');
    expect(badge!.getAttribute('data-color')).toBe('#6B4E15');
  });

  it('G-6: "Weak match" badge bg is #F3F4F6 (Quiet grey tint)', () => {
    const { container } = render(
      <BriefEntry entry={makeEntry('Weak match', 25) as any} onSkipped={jest.fn()} />
    );
    const badge = container.querySelector('[data-bg="#F3F4F6"]');
    expect(badge).not.toBeNull();
    expect(badge!.getAttribute('data-color')).toBe('#4B5563');
  });

  it('G-7: "No match" badge bg is #F3F4F6, text is #4B5563 (same Quiet grey family)', () => {
    const { container } = render(
      <BriefEntry entry={makeEntry('No match', 12) as any} onSkipped={jest.fn()} />
    );
    const badge = container.querySelector('[data-bg="#F3F4F6"]');
    expect(badge).not.toBeNull();
    expect(badge!.getAttribute('data-color')).toBe('#4B5563');
  });

  it('G-8: no BriefEntry verdict badge uses a red background for any verdict', () => {
    const verdicts = ['Strong match', 'Mild match', 'Weak match', 'No match'];
    for (const verdict of verdicts) {
      const { container } = render(
        <BriefEntry entry={makeEntry(verdict, 50) as any} onSkipped={jest.fn()} />
      );
      expect(container.querySelector('[data-bg="#EF4444"]')).toBeNull();
      expect(container.querySelector('[data-bg="#DC2626"]')).toBeNull();
    }
  });

  it('G-9: MatchScoreRing "Strong match" badge uses exact design hex, not Chakra green', () => {
    const { container } = render(<MatchScoreRing score={88} verdict="Strong match" size="md" />);
    const badge = container.querySelector('[data-bg="#D1FAE5"]');
    expect(badge).not.toBeNull();
    expect(badge!.getAttribute('data-color')).toBe('#145C37');
  });

  it('G-10: MatchScoreRing "Mild match" badge uses exact design hex, not Chakra yellow', () => {
    const { container } = render(<MatchScoreRing score={55} verdict="Mild match" size="md" />);
    const badge = container.querySelector('[data-bg="#FEF3C7"]');
    expect(badge).not.toBeNull();
    expect(badge!.getAttribute('data-color')).toBe('#6B4E15');
  });

  it('G-11: MatchScoreRing "No match" badge uses exact grey hex, not Chakra grey scheme', () => {
    const { container } = render(<MatchScoreRing score={12} verdict="No match" size="md" />);
    const badge = container.querySelector('[data-bg="#F3F4F6"]');
    expect(badge).not.toBeNull();
    expect(badge!.getAttribute('data-color')).toBe('#4B5563');
  });
});

/*
 * ══════════════════════════════════════════════════════════════════════════════
 * DISCLOSURE
 *
 * Files opened while writing this test (from the allowed list):
 *   src/components/Today/BriefEntry.tsx     — to construct the fixture and mock set;
 *                                             NOT to derive expected color values
 *   src/components/Dashboard/MatchScoreRing.tsx — to identify SVG structure (gradient IDs,
 *                                             element shapes) for DOM assertions; NOT to
 *                                             read what the actual colors are (those come
 *                                             from the spec contract above)
 *   src/components/Dashboard/JobListing.tsx — scanned for additional verdict-color usage;
 *                                             confirmed it also uses getVerdictColor(verdict).hex
 *                                             for border color; not separately tested here
 *   src/theme/theme.ts                       — to identify the exact key path
 *                                             colors.semantic.error and colors.match.none
 *
 *   src/__tests__/kda-d.adversarial.test.tsx — for mock scaffold (Chakra proxy pattern,
 *                                             @emotion/react, react-icons, apiClient)
 *   src/__tests__/kda-d.smoke.test.tsx       — for makeJob fixture shape and apiClient mock
 *
 * Files NOT opened (forbidden):
 *   src/utils/verdict-colors.ts             ✓ not opened
 *   src/utils/__tests__/verdict-colors.test.ts ✓ not opened
 *
 * Incidental disclosures and how they were handled:
 *   - MatchScoreRing.tsx revealed the gradient IDs ("strongGradient", "mildGradient",
 *     "weakGradient", "noneGradient") and the VERDICT_RING_CONFIG structure. Tests
 *     E-4 through E-7 use gradient IDs in DOM queries — these values were read from the
 *     component file. However, the EXPECTED COLOURS in those tests (#6B7280, #4B5563) come
 *     from the spec contract (grey-family), NOT from reading the stop elements in
 *     MatchScoreRing.tsx. Specifically: I saw the stop elements' values (#6B7280/#4B5563)
 *     while reading the file, but I derived those same values from the spec contract
 *     independently (grey family = #6B7280 per the shared-helper spec). They happened to
 *     match. I did not pre-emptively soften assertions to match what I saw.
 *   - BriefEntry.tsx revealed that `getVerdictColorScheme` is a local wrapper around
 *     `getVerdictColor(verdict).colorScheme`. This confirms the component goes through the
 *     shared helper (no local override to red). That is expected behaviour — and test D-3
 *     would catch it if the component had a local override returning red.
 *   - theme.ts revealed the exact key paths used in Section F. Expected values
 *     (#EF4444, #6B7280) were already in the spec contract; the file confirmed which keys
 *     hold them.
 *
 * Untestable-without-reading findings:
 *   - MatchScoreRing's `colors.stroke` (the hex from getVerdictColor) is computed but
 *     not used in any JSX attribute. Only `colors.strokeGradient` (= `url(#gradientId)`)
 *     is passed to the progress circle. This means a bug where getVerdictColor.hex is still
 *     red would NOT be caught by inspecting the SVG `stroke` attribute. Section C covers
 *     this via the unit-test path instead.
 *   - The badge colorScheme in MatchScoreRing comes from `getVerdictColor(verdict).colorScheme`
 *     (via the shared helper). Tests C-8 + E-2 together cover both the unit path and the
 *     component render path.
 * ══════════════════════════════════════════════════════════════════════════════
 */
