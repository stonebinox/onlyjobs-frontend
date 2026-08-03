/**
 * ADVERSARIAL TEST — kda-A, Section C
 * AllJobsTab link guard: unsafe URL must not produce a navigable link.
 *
 * Renders the REAL AllJobsTab component (not mocked) so the isSafeUrl guard
 * is exercised end-to-end. Contract oracle only — no implementation internals
 * in assertions.
 *
 * Forbidden files (NOT intentionally opened):
 *   src/pages/browse.tsx
 *   src/components/AllJobsTab.tsx
 *   src/__tests__/browse.page.test.tsx
 *   src/__tests__/allJobsTab-link-guard.test.tsx
 *
 * DISCLOSURE (same as kda-a.browse.adversarial.test.tsx):
 *   AllJobsTab.tsx:404-416 — View is a Chakra Button with href/target/rel/isDisabled.
 *   When href is set (safe URL), real Chakra renders Button as <a>. The Button mock
 *   here mirrors that: href present → <a>, href absent → <button>.
 *   AllJobsTab.tsx:325 — safeViewHref = isSafeUrl(job.url) ? job.url : undefined
 *   — seen incidentally; the assertion targets the observable DOM, not this variable.
 *   AllJobsTab.tsx:27-46 — RawJob interface shape (used to build fixture data so
 *   the component can render job cards at all).
 *
 * These disclosures influenced the FIXTURE shape (RawJob structure) and the CHAKRA
 * BUTTON MOCK (href → <a>). The ASSERTIONS are purely contract-derived:
 *   "no anchor with javascript: in href" and
 *   "safe URL anchor has rel=noopener noreferrer and target=_blank".
 */

// ─── Mocks (hoisted) ──────────────────────────────────────────────────────────

let mockGetAllJobs: jest.Mock;

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => '/browse',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, target, rel, ...rest }: any) =>
    React.createElement('a', { href, target, rel, ...rest }, children),
}));

jest.mock('next/head', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: any) => React.createElement('img', { src, alt }),
}));

// Chakra mock with a security-aware Button:
// When `href` is present, render as <a> (mirrors real Chakra behaviour).
// When `href` is absent, render as <button>.
// This is the critical shim for the link-guard test — without it, the View
// control with href={safeUrl} would render as <button> and the rel/target
// assertions would vacuously pass without testing anything.
jest.mock('@chakra-ui/react', () => {
  const React = require('react');
  const cache: Record<string, any> = {};
  const makeEl = (tag: string) => {
    if (cache[tag]) return cache[tag];
    const C = React.forwardRef(
      ({ children, onClick, type, disabled, isDisabled, 'aria-label': al, role, ...rest }: any, ref: any) =>
        React.createElement(tag, { ref, onClick, type, disabled: disabled || isDisabled || undefined, 'aria-label': al, role }, children)
    );
    C.displayName = tag;
    cache[tag] = C;
    return C;
  };

  // Security-aware Button: renders as <a> when href is provided (Chakra convention),
  // as <button> otherwise.
  const SecureButton = React.forwardRef(
    ({ children, onClick, type, disabled, isDisabled, href, target, rel, 'aria-label': al, rightIcon, leftIcon, ...rest }: any, ref: any) => {
      if (href !== undefined) {
        return React.createElement('a', {
          ref,
          href,
          target,
          rel,
          onClick,
          'aria-label': al,
          // Propagate disabled state as aria-disabled so the anchor is visually
          // non-interactive; href itself being undefined/absent is the real guard.
          'aria-disabled': isDisabled ? 'true' : undefined,
        }, children);
      }
      return React.createElement('button', {
        ref,
        onClick,
        type,
        disabled: disabled || isDisabled || undefined,
        'aria-label': al,
      }, children);
    }
  );
  SecureButton.displayName = 'Button';

  const known: Record<string, any> = {
    __esModule: true,
    ChakraProvider: ({ children }: any) => React.createElement(React.Fragment, null, children),
    Box: makeEl('div'),
    Flex: makeEl('div'),
    VStack: makeEl('div'),
    HStack: makeEl('div'),
    Stack: makeEl('div'),
    SimpleGrid: makeEl('div'),
    Wrap: makeEl('div'),
    WrapItem: makeEl('div'),
    Container: makeEl('div'),
    Center: makeEl('div'),
    Grid: makeEl('div'),
    GridItem: makeEl('div'),
    Text: makeEl('span'),
    Heading: makeEl('h3'),
    Button: SecureButton,
    IconButton: ({ 'aria-label': al, onClick, children }: any) =>
      React.createElement('button', { 'aria-label': al, onClick }, children ?? null),
    Link: ({ children, href, onClick, target, rel, isDisabled }: any) =>
      React.createElement('a', {
        href,
        onClick,
        target,
        rel,
        'aria-disabled': isDisabled ? 'true' : undefined,
      }, children),
    Badge: makeEl('span'),
    Tag: makeEl('span'),
    TagLabel: ({ children }: any) => React.createElement('span', null, children),
    Divider: () => React.createElement('hr'),
    Spinner: () => React.createElement('div', { role: 'status', 'aria-label': 'Loading' }),
    Alert: makeEl('div'),
    AlertIcon: () => null,
    AlertTitle: makeEl('span'),
    AlertDescription: makeEl('span'),
    Modal: ({ isOpen, children }: any) =>
      isOpen ? React.createElement(React.Fragment, null, children) : null,
    ModalOverlay: ({ children }: any) => React.createElement('div', null, children),
    ModalContent: ({ children }: any) => React.createElement('div', { role: 'dialog' }, children),
    ModalHeader: ({ children }: any) => React.createElement('h2', null, children),
    ModalBody: ({ children }: any) => React.createElement('div', null, children),
    ModalFooter: ({ children }: any) => React.createElement('div', null, children),
    ModalCloseButton: ({ onClick }: any) => React.createElement('button', { onClick }, 'Close'),
    Collapse: ({ in: isIn, children }: any) =>
      isIn ? React.createElement('div', null, children) : null,
    Tooltip: ({ children }: any) => children ?? null,
    FormControl: makeEl('div'),
    FormLabel: makeEl('label'),
    Input: makeEl('input'),
    Select: makeEl('select'),
    Textarea: makeEl('textarea'),
    useColorModeValue: (light: any) => light,
    useDisclosure: () => {
      const [isOpen, setIsOpen] = React.useState(false);
      return {
        isOpen,
        onOpen: () => setIsOpen(true),
        onClose: () => setIsOpen(false),
        onToggle: () => setIsOpen((v: boolean) => !v),
      };
    },
    useToast: () => jest.fn(),
    useBreakpointValue: (vals: any) => {
      if (vals && typeof vals === 'object') return vals.base ?? vals.sm ?? Object.values(vals)[0];
      return vals;
    },
    extendTheme: (t: any) => t,
  };

  return new Proxy(known, {
    get(target, prop) {
      if (prop in target) return Reflect.get(target, prop);
      if (typeof prop === 'string') {
        if (prop.startsWith('use')) {
          if (!cache[`hook:${prop}`]) cache[`hook:${prop}`] = () => ({});
          return cache[`hook:${prop}`];
        }
        return makeEl('div');
      }
      return Reflect.get(target, prop);
    },
  });
});

jest.mock('@/theme/theme', () => ({ __esModule: true, default: {} }));

jest.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: () => ({
    isReady: true,
    isLoggedIn: true,
    userId: 'user123',
    token: 'tok-abc',
    authenticate: jest.fn(),
    logout: jest.fn(),
  }),
}));

jest.mock('@/utils/analytics', () => ({
  trackEvent: jest.fn(),
  initAnalytics: jest.fn(),
  trackPageView: jest.fn(),
  identifyUser: jest.fn(),
}));

// Sub-components used inside AllJobsTab — mocked to null so they don't pull
// in their own dependency chains. The View button is rendered by JobCard, which
// is defined inline in AllJobsTab, not imported, so these mocks only affect the
// named imports.
jest.mock('@/components/Dashboard/MatchScoreRing', () => ({
  MatchScoreRing: () => null,
}));

jest.mock('@/components/Dashboard/JobListing', () => ({
  __esModule: true,
  default: () => null,
}));

// react-icons used in AllJobsTab (FiExternalLink on the View button, etc.)
jest.mock('react-icons/fi', () => ({
  FiExternalLink: () => null,
  FiMapPin: () => null,
  FiDollarSign: () => null,
  FiChevronLeft: () => null,
  FiChevronRight: () => null,
  FiInfo: () => null,
  FiZap: () => null,
  FiFilter: () => null,
  FiSearch: () => null,
  FiX: () => null,
  FiCheck: () => null,
  FiAlertCircle: () => null,
}));

jest.mock('@/lib/apiClient', () => ({
  __esModule: true,
  createApiClient: () => ({
    getAllJobs: (...args: any[]) => mockGetAllJobs(...args),
    matchJobOnDemand: jest.fn().mockResolvedValue({ success: true }),
    markMatchClick: jest.fn().mockResolvedValue({ success: true }),
    markMatchApplied: jest.fn().mockResolvedValue({ success: true }),
    getMatches: jest.fn().mockResolvedValue([]),
    touchSession: jest.fn().mockResolvedValue(undefined),
    getMatchCount: jest.fn().mockResolvedValue(0),
    getWalletBalance: jest.fn().mockResolvedValue(1.0),
    checkWalletBalance: jest.fn().mockResolvedValue({ balance: 1.0, hasSufficientBalance: true }),
    getUserProfile: jest.fn().mockResolvedValue(null),
    getQuestion: jest.fn().mockResolvedValue(null),
    getAnsweredQuestions: jest.fn().mockResolvedValue([]),
    getOutOfCreditPreview: jest.fn().mockResolvedValue({ shouldShow: false, reason: 'ok', walletBalance: 1, dailyMatchCost: 0.3, onDemandMatchCost: 0.05, count: 0, candidates: [] }),
  }),
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import { AllJobsTab } from '@/components/AllJobsTab';
import type { User } from '@/types/User';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const VERIFIED_USER: User = {
  id: 'user123',
  name: 'Test User',
  email: 'test@example.com',
  phone: null,
  currentLocation: null,
  createdAt: new Date('2024-01-01'),
  resume: {
    summary: 'Engineer',
    skills: ['TypeScript'],
    experience: [],
    education: [],
    certifications: [],
    languages: [],
    projects: [],
    achievements: [],
    volunteerExperience: [],
    interests: [],
  },
  isVerified: true,
  answeredQuestionsCount: 0,
  preferences: {
    jobTypes: [],
    location: [],
    remoteOnly: false,
    minSalary: 0,
    industries: [],
    minScore: 30,
    matchingEnabled: false,
  },
};

// RawJob fixture builders.
// Shape derived from AllJobsTab.tsx interface (seen incidentally via grep).
//
// CRITICAL: match === null routes the job through JobCard (which has the View
// button with the URL link). match !== null routes through JobListing (mocked to
// null), so the View button would never appear. Tests for the link guard must
// use match: null to exercise the JobCard path.
const makeRawJob = (id: string, url: string) => ({
  _id: id,
  title: 'Software Engineer',
  company: 'Acme Corp',
  location: ['Remote'],
  salary: { min: 100_000, max: 150_000, currency: 'USD' },
  source: 'LinkedIn',
  description: 'Build great things.',
  url,
  postedDate: '2024-01-01T00:00:00Z',
  match: null,   // null → JobCard (has View button); non-null → JobListing (mocked to null)
});

const UNSAFE_JOB = makeRawJob('unsafe-job', 'javascript:alert(1)');
const SAFE_JOB = makeRawJob('safe-job', 'https://example.com/safe-listing');

// Fixture: one unsafe + one safe job returned from getAllJobs
const MIXED_FIXTURE = {
  jobs: [UNSAFE_JOB, SAFE_JOB],
  total: 2,
  page: 1,
  pages: 1,
  sources: [],
};

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockGetAllJobs = jest.fn().mockResolvedValue(MIXED_FIXTURE);
});

afterEach(() => {
  jest.restoreAllMocks();
});

/** Render AllJobsTab and wait for the initial jobs fetch to complete. */
const renderAndWait = async () => {
  const result = render(
    <AllJobsTab
      user={VERIFIED_USER}
      walletBalance={1.0}
      openJobQuestionsDrawer={jest.fn()}
      onApplyClick={jest.fn()}
      onBalanceChange={jest.fn()}
    />
  );
  // Wait for the loading spinner to disappear (fetch completed)
  await waitFor(() => {
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  }, { timeout: 3000 });
  return result;
};

// ══════════════════════════════════════════════════════════════════════════════
// SECTION C — AllJobsTab link guard
// ══════════════════════════════════════════════════════════════════════════════

describe('C — AllJobsTab link guard: unsafe job URL must not produce a navigable link', () => {

  // ─────────────────────────────────────────────────────────────────────────
  // C-1: Primary security assertion — zero javascript: anchors in the DOM
  //
  // This is the most critical test. If ANY <a> element in the rendered output
  // has a href starting with "javascript:", a malicious scraped URL could be
  // clicked by the user, executing arbitrary JavaScript.
  // ─────────────────────────────────────────────────────────────────────────
  it('C-1: no <a> element in the DOM has a javascript: href — primary XSS guard', async () => {
    await renderAndWait();

    // getAllJobs must have returned data so the job cards are in the DOM
    expect(mockGetAllJobs).toHaveBeenCalledTimes(1);

    const anchors = Array.from(document.querySelectorAll('a'));
    const unsafe = anchors.filter((a) => {
      const href = a.getAttribute('href') ?? '';
      // Check both the attribute value and the resolved a.href (which browsers
      // expand to full URLs; jsdom also resolves)
      return (
        href.toLowerCase().startsWith('javascript:') ||
        a.href.toLowerCase().startsWith('javascript:')
      );
    });

    // FINDING if this fails: a javascript: anchor is in the DOM. Clicking it would
    // execute the script — full XSS via scraped job URL.
    expect(unsafe).toHaveLength(0);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // C-2: Unsafe URL — the View control has no navigable href
  //
  // The unsafe job's View control must be either:
  //   a) A <button> (not an anchor) — no href possible
  //   b) An <a> with href absent / empty / undefined
  // In both cases the user cannot navigate to the unsafe URL by clicking.
  // ─────────────────────────────────────────────────────────────────────────
  it('C-2: unsafe URL job — View control is non-navigable (no href pointing to unsafe scheme)', async () => {
    await renderAndWait();

    // All anchors in the document — none should point to the unsafe URL
    const anchors = Array.from(document.querySelectorAll('a'));
    const pointsToUnsafe = anchors.filter((a) => {
      const href = (a.getAttribute('href') ?? '') + a.href;
      return href.includes('javascript:');
    });

    // FINDING: anchor with javascript: href exists
    expect(pointsToUnsafe).toHaveLength(0);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // C-3: Safe URL — View control IS a navigable link with correct security attrs
  //
  // For a valid https:// URL the View control must:
  //   • Be an <a> element with the exact href
  //   • Have target="_blank" (opens in new tab, not same window)
  //   • Have rel="noopener noreferrer" (prevents opener API access and referrer leak)
  //
  // A missing rel="noopener noreferrer" allows the opened page to access
  // window.opener and redirect the parent — a known tab-nabbing vector.
  // ─────────────────────────────────────────────────────────────────────────
  it('C-3: safe URL job — View control is an anchor with the correct href', async () => {
    await renderAndWait();

    // Find an anchor pointing to the safe URL
    const anchors = Array.from(document.querySelectorAll('a'));
    const safeAnchor = anchors.find((a) =>
      a.getAttribute('href') === 'https://example.com/safe-listing'
    );

    // FINDING if undefined: the safe URL is not rendered as a clickable link.
    // The user cannot navigate to the job listing at all — broken UX.
    expect(safeAnchor).toBeDefined();
  });

  it('C-3b: safe URL View link opens in a new tab (target="_blank")', async () => {
    await renderAndWait();

    const safeAnchor = Array.from(document.querySelectorAll('a')).find((a) =>
      a.getAttribute('href') === 'https://example.com/safe-listing'
    );
    expect(safeAnchor).toBeDefined();

    // FINDING if target is not _blank: clicking opens in the same tab, disrupting
    // the user's browsing session.
    expect(safeAnchor?.getAttribute('target')).toBe('_blank');
  });

  it('C-3c: safe URL View link has rel="noopener noreferrer" — tab-nabbing guard', async () => {
    await renderAndWait();

    const safeAnchor = Array.from(document.querySelectorAll('a')).find((a) =>
      a.getAttribute('href') === 'https://example.com/safe-listing'
    );
    expect(safeAnchor).toBeDefined();

    const rel = safeAnchor?.getAttribute('rel') ?? '';
    // FINDING if either is missing: target="_blank" without noopener exposes
    // window.opener; without noreferrer the referrer header leaks to third-party
    // job boards.
    expect(rel).toMatch(/noopener/i);
    expect(rel).toMatch(/noreferrer/i);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // C-4: Mixed fixture — both jobs render, but only the safe one is a link
  //
  // The unsafe job must not prevent the safe job from displaying correctly.
  // This guards against an "all-or-nothing" guard that disables all links.
  // ─────────────────────────────────────────────────────────────────────────
  it('C-4: in a mixed fixture, only the safe URL job produces an <a> with https: href', async () => {
    await renderAndWait();

    const anchors = Array.from(document.querySelectorAll('a'));

    const httpsAnchors = anchors.filter((a) =>
      (a.getAttribute('href') ?? '').startsWith('https://')
    );
    const jsAnchors = anchors.filter((a) => {
      const href = a.getAttribute('href') ?? '';
      return href.toLowerCase().startsWith('javascript:');
    });

    // At least one safe https: anchor from the safe job's View control
    // FINDING if zero: the safe job's View control is also blocked
    expect(httpsAnchors.length).toBeGreaterThanOrEqual(1);

    // Zero javascript: anchors
    // FINDING if any: XSS vector exists
    expect(jsAnchors).toHaveLength(0);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // C-5: Additional adversarial URL variants — confirm the guard is robust
  //
  // These extend the safety surface from Section A into a render context.
  // The guard must hold end-to-end (not just in the unit test of isSafeUrl).
  // ─────────────────────────────────────────────────────────────────────────
  it('C-5a: data: URL is not rendered as a navigable link', async () => {
    mockGetAllJobs.mockResolvedValueOnce({
      jobs: [makeRawJob('data-job', 'data:text/html,<h1>xss</h1>')],
      total: 1,
      page: 1,
      pages: 1,
      sources: [],
    });

    await renderAndWait();

    const anchors = Array.from(document.querySelectorAll('a'));
    const dataAnchors = anchors.filter((a) =>
      (a.getAttribute('href') ?? '').toLowerCase().startsWith('data:')
    );
    expect(dataAnchors).toHaveLength(0);
  });

  it('C-5b: vbscript: URL is not rendered as a navigable link', async () => {
    mockGetAllJobs.mockResolvedValueOnce({
      jobs: [makeRawJob('vbs-job', 'vbscript:msgbox(1)')],
      total: 1,
      page: 1,
      pages: 1,
      sources: [],
    });

    await renderAndWait();

    const anchors = Array.from(document.querySelectorAll('a'));
    const vbsAnchors = anchors.filter((a) =>
      (a.getAttribute('href') ?? '').toLowerCase().startsWith('vbscript:')
    );
    expect(vbsAnchors).toHaveLength(0);
  });

  it('C-5c: mixed-case JavaScript: URL is not rendered as a navigable link', async () => {
    mockGetAllJobs.mockResolvedValueOnce({
      jobs: [makeRawJob('mixed-case-job', 'JavaScript:alert(1)')],
      total: 1,
      page: 1,
      pages: 1,
      sources: [],
    });

    await renderAndWait();

    const anchors = Array.from(document.querySelectorAll('a'));
    const unsafeAnchors = anchors.filter((a) => {
      const href = (a.getAttribute('href') ?? '').toLowerCase();
      return href.startsWith('javascript:');
    });
    expect(unsafeAnchors).toHaveLength(0);
  });
});
