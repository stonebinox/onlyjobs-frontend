/**
 * Regression test — JobListing safe-URL guard (onlyjobs-q3y).
 *
 * Security contract:
 *   1. window.open must NOT be called with a javascript: or data: URL.
 *   2. window.open on a safe https:// URL must pass "noopener,noreferrer" as
 *      the third argument (reverse tabnabbing mitigation).
 *
 * Oracle: the security spec in task onlyjobs-q3y — NOT what the code outputs.
 *
 * Files read during authorship (disclosure):
 *   src/components/Dashboard/JobListing.tsx — prop interface and component shape
 *   src/types/JobResult.ts, Job.ts, Salary.ts — type shapes to build fixtures
 *   jest.config.ts, jest.setup.ts — test harness config
 *   src/__tests__/allJobsTab-link-guard.test.tsx — Chakra mock pattern (adapted verbatim)
 *
 * Implementation bodies NOT read:
 *   src/utils/brief-utils.ts body past the isSafeUrl signature
 *   handleApplyClick body — this test must catch bugs in it, not reflect it
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
    useToast: () => jest.fn(),
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

jest.mock('@/utils/analytics', () => ({
  trackEvent: jest.fn(),
}));

jest.mock('@/utils/date-formatter', () => ({
  formatDate: () => 'Jan 1, 2024',
}));

jest.mock('@/utils/text-formatter', () => ({
  numberFormatter: (n: number) => String(n),
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
import { render, screen, fireEvent } from '@testing-library/react';
import JobListing from '@/components/Dashboard/JobListing';
import type { JobResult } from '@/types/JobResult';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeJob = (url: string): JobResult => ({
  _id: 'match1',
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
});

afterEach(() => {
  jest.restoreAllMocks();
});

const renderListing = (url: string) =>
  render(
    <JobListing
      job={makeJob(url)}
      openJobQuestionsDrawer={jest.fn()}
      onApplyClick={jest.fn()}
    />
  );

// ─── Tests ────────────────────────────────────────────────────────────────────

// ══════════════════════════════════════════════════════════════════════════════
// 1. Unsafe URL — window.open must NOT be called
//    Contract: clicking Apply with a javascript: URL must not navigate to it
//    (XSS via javascript: scheme).
// ══════════════════════════════════════════════════════════════════════════════

describe('1 — unsafe URL: Apply does not call window.open', () => {
  it('javascript: URL — window.open is not called', () => {
    renderListing('javascript:alert(1)');
    const applyBtn = screen.getByRole('button', { name: /apply/i });
    fireEvent.click(applyBtn);
    expect(window.open).not.toHaveBeenCalled();
  });

  it('data: URL — window.open is not called', () => {
    renderListing('data:text/html,<script>alert(1)</script>');
    const applyBtn = screen.getByRole('button', { name: /apply/i });
    fireEvent.click(applyBtn);
    expect(window.open).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. Safe URL — window.open called with noopener,noreferrer
//    Contract: clicking Apply with an https:// URL must call window.open with
//    "noopener,noreferrer" as the third argument (reverse tabnabbing mitigation).
// ══════════════════════════════════════════════════════════════════════════════

describe('2 — safe URL: window.open called with noopener,noreferrer', () => {
  const SAFE_URL = 'https://example.com/job-posting';

  it('window.open is called with the correct URL', () => {
    renderListing(SAFE_URL);
    const applyBtn = screen.getByRole('button', { name: /apply/i });
    fireEvent.click(applyBtn);
    expect(window.open).toHaveBeenCalled();
    expect((window.open as jest.Mock).mock.calls[0][0]).toBe(SAFE_URL);
  });

  it('window.open third arg includes noopener and noreferrer', () => {
    renderListing(SAFE_URL);
    const applyBtn = screen.getByRole('button', { name: /apply/i });
    fireEvent.click(applyBtn);
    const thirdArg: string = (window.open as jest.Mock).mock.calls[0][2] ?? '';
    expect(thirdArg).toContain('noopener');
    expect(thirdArg).toContain('noreferrer');
  });

  it('window.open second arg is _blank', () => {
    renderListing(SAFE_URL);
    const applyBtn = screen.getByRole('button', { name: /apply/i });
    fireEvent.click(applyBtn);
    expect((window.open as jest.Mock).mock.calls[0][1]).toBe('_blank');
  });
});
