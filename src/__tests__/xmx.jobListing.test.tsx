/**
 * Regression test — onlyjobs-xmx: JobListing handleApplyClick contract.
 *
 * Contracts tested (oracle: task spec, NOT current code output):
 *   1. SAFE url: window.open called with (url, "_blank", "noopener,noreferrer");
 *      markMatchClick called with matchId; onApplyClick called with the job;
 *      trackEvent NOT called with "match_applied" (opening a listing ≠ applying).
 *   2. UNSAFE url (e.g. "javascript:alert(1)"): total no-op — window.open NOT
 *      called, markMatchClick NOT called, onApplyClick NOT called,
 *      trackEvent NOT called.
 *
 * Disclosure: read JobListing.tsx for prop interface and fixture shape; read
 * types/JobResult.ts and Salary.ts for fixture structure; read jest harness
 * config and jobListing-link-guard.test.tsx for mock patterns. Implementation
 * body of handleApplyClick was read only after spec was written.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@chakra-ui/react', () => {
  const React = require('react');
  const cache: Record<string, any> = {};
  const makeEl = (tag: string) => {
    if (cache[tag]) return cache[tag];
    const C = React.forwardRef(
      ({ children, onClick, type, disabled, isDisabled, 'aria-label': al, href, role, ...rest }: any, ref: any) =>
        React.createElement(tag, { ref, onClick, type, disabled: disabled || isDisabled || undefined, 'aria-label': al, href, role }, children)
    );
    C.displayName = tag;
    cache[tag] = C;
    return C;
  };
  const mockToast = jest.fn();
  const known: Record<string, any> = {
    __esModule: true,
    ChakraProvider: ({ children }: any) => React.createElement(React.Fragment, null, children),
    Box: makeEl('div'),
    Flex: makeEl('div'),
    VStack: makeEl('div'),
    HStack: makeEl('div'),
    Wrap: makeEl('div'),
    WrapItem: makeEl('div'),
    Text: makeEl('span'),
    Heading: makeEl('h3'),
    Button: makeEl('button'),
    Badge: makeEl('span'),
    Tooltip: ({ children }: any) => children,
    Textarea: makeEl('textarea'),
    Modal: ({ children, isOpen }: any) => isOpen ? React.createElement(React.Fragment, null, children) : null,
    ModalOverlay: () => null,
    ModalContent: makeEl('div'),
    ModalHeader: makeEl('div'),
    ModalCloseButton: makeEl('button'),
    ModalBody: makeEl('div'),
    ModalFooter: makeEl('div'),
    useDisclosure: () => ({ isOpen: false, onOpen: jest.fn(), onClose: jest.fn() }),
    useColorModeValue: (light: any) => light,
    useToast: () => mockToast,
    useBreakpointValue: (vals: any) => {
      if (vals && typeof vals === 'object') return vals.base ?? vals.sm ?? vals.md ?? Object.values(vals)[0];
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

jest.mock('@/components/Dashboard/MatchScoreRing', () => ({
  MatchScoreRing: () => null,
}));
jest.mock('@/components/Dashboard/AIReasoningBox', () => ({
  AIReasoningBox: () => null,
}));

jest.mock('@/utils/date-formatter', () => ({
  formatDate: () => 'Jan 1, 2024',
}));

jest.mock('@/utils/text-formatter', () => ({
  numberFormatter: (n: number) => String(n),
}));

const mockTrackEvent = jest.fn();
jest.mock('@/utils/analytics', () => ({
  trackEvent: (...args: any[]) => mockTrackEvent(...args),
}));

const mockMarkMatchClick = jest.fn().mockResolvedValue(undefined);
const mockMarkMatchAsSkipped = jest.fn().mockResolvedValue(undefined);

jest.mock('@/lib/apiClient', () => ({
  __esModule: true,
  createApiClient: () => ({
    markMatchClick: (...args: any[]) => mockMarkMatchClick(...args),
    markMatchAsSkipped: (...args: any[]) => mockMarkMatchAsSkipped(...args),
  }),
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import JobListing from '@/components/Dashboard/JobListing';
import type { JobResult } from '@/types/JobResult';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MATCH_ID = 'match-xmx-1';
const SAFE_URL = 'https://example.com/job-posting';
const UNSAFE_URL = 'javascript:alert(1)';

const makeJob = (url: string): JobResult => ({
  _id: MATCH_ID,
  userId: 'user1',
  jobId: 'job1',
  matchScore: 85,
  verdict: 'Strong match',
  reasoning: 'Great fit',
  clicked: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  skipped: false,
  applied: null,
  job: {
    _id: 'job1',
    title: 'Software Engineer',
    company: 'Acme Corp',
    location: ['Remote'],
    salary: { min: 100000, max: 150000, currency: 'USD', estimated: false },
    tags: ['TypeScript', 'React'],
    source: 'linkedin',
    description: 'An exciting role.',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    postedDate: '2024-01-01T00:00:00Z',
    scrapedDate: '2024-01-01T00:00:00Z',
    url,
  },
});

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.spyOn(window, 'open').mockImplementation(() => null);
  mockMarkMatchClick.mockClear();
  mockMarkMatchAsSkipped.mockClear();
  mockTrackEvent.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

const renderListing = (url: string) => {
  const onApplyClick = jest.fn();
  render(
    <JobListing
      job={makeJob(url)}
      openJobQuestionsDrawer={jest.fn()}
      onApplyClick={onApplyClick}
    />
  );
  return { onApplyClick };
};

// ─── Tests ────────────────────────────────────────────────────────────────────

// ══════════════════════════════════════════════════════════════════════════════
// 1. SAFE url — full open sequence fires; trackEvent("match_applied") NOT fired
//    Contract: opening a listing registers a visit but does not count as
//    "applied". match_applied is only fired by ApplicationStatusBanner when
//    the user explicitly confirms "Yes, I applied".
// ══════════════════════════════════════════════════════════════════════════════

describe('1 — safe URL: open sequence fires correctly', () => {
  it('window.open called with correct url, _blank, noopener,noreferrer', async () => {
    renderListing(SAFE_URL);
    fireEvent.click(screen.getByRole('button', { name: /apply/i }));
    expect(window.open).toHaveBeenCalledWith(SAFE_URL, '_blank', 'noopener,noreferrer');
  });

  it('markMatchClick called with the matchId', async () => {
    renderListing(SAFE_URL);
    fireEvent.click(screen.getByRole('button', { name: /apply/i }));
    await waitFor(() => expect(mockMarkMatchClick).toHaveBeenCalledWith(MATCH_ID));
  });

  it('onApplyClick called with the full job result', async () => {
    const { onApplyClick } = renderListing(SAFE_URL);
    fireEvent.click(screen.getByRole('button', { name: /apply/i }));
    await waitFor(() =>
      expect(onApplyClick).toHaveBeenCalledWith(
        expect.objectContaining({ _id: MATCH_ID })
      )
    );
  });

  it('trackEvent NOT called with "match_applied" (opening ≠ applying)', async () => {
    renderListing(SAFE_URL);
    fireEvent.click(screen.getByRole('button', { name: /apply/i }));
    await waitFor(() => expect(mockMarkMatchClick).toHaveBeenCalled());
    expect(mockTrackEvent).not.toHaveBeenCalledWith('match_applied');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. UNSAFE url — total no-op
//    Contract: clicking Apply with an unsafe URL must not open a window,
//    record a click, invoke onApplyClick, or fire any analytics.
// ══════════════════════════════════════════════════════════════════════════════

describe('2 — unsafe URL: total no-op', () => {
  it('window.open NOT called', () => {
    renderListing(UNSAFE_URL);
    fireEvent.click(screen.getByRole('button', { name: /apply/i }));
    expect(window.open).not.toHaveBeenCalled();
  });

  it('markMatchClick NOT called', async () => {
    renderListing(UNSAFE_URL);
    fireEvent.click(screen.getByRole('button', { name: /apply/i }));
    // Give async handlers a chance to run
    await Promise.resolve();
    expect(mockMarkMatchClick).not.toHaveBeenCalled();
  });

  it('onApplyClick NOT called', async () => {
    const { onApplyClick } = renderListing(UNSAFE_URL);
    fireEvent.click(screen.getByRole('button', { name: /apply/i }));
    await Promise.resolve();
    expect(onApplyClick).not.toHaveBeenCalled();
  });

  it('trackEvent NOT called', async () => {
    renderListing(UNSAFE_URL);
    fireEvent.click(screen.getByRole('button', { name: /apply/i }));
    await Promise.resolve();
    expect(mockTrackEvent).not.toHaveBeenCalled();
  });
});
