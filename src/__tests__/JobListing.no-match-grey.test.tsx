/**
 * Regression test — JobListing "No match" left-border accent is grey, NOT red.
 *
 * Contract (onlyjobs-drq): when verdict === "No match", the left-border accent
 * of the job card must use hex #6B7280 (grey). It must NOT use #EF4444.
 *
 * Oracle: product spec in onlyjobs-drq — NOT what the code currently outputs.
 *
 * The accent colour lives in the _before.background CSS-in-JS prop on the
 * outermost Box. The Box mock below exposes it as data-accent-color so tests
 * can assert the value without reading Chakra internals.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@emotion/react', () => ({
  keyframes: () => 'mock-keyframes',
  css: (...args: any[]) => args,
}));

jest.mock('@chakra-ui/react', () => {
  const React = require('react');

  // Box: exposes _before.background as data-accent-color for accent/border assertions
  const Box = React.forwardRef(
    ({ as: Tag = 'div', children, animation, _before, ...rest }: any, ref: any) => {
      const passedProps: Record<string, any> = {};
      if (_before?.background) {
        passedProps['data-accent-color'] = _before.background;
      }
      return React.createElement(Tag, { ref, ...passedProps }, children);
    }
  );
  Box.displayName = 'Box';

  const el = (tag: string) => {
    const C = ({ children }: any) => React.createElement(tag, {}, children);
    C.displayName = tag;
    return C;
  };

  return {
    __esModule: true,
    Box,
    Badge: el('span'),
    Heading: el('h3'),
    Text: el('span'),
    HStack: el('div'),
    VStack: el('div'),
    Flex: el('div'),
    Button: el('button'),
    Tooltip: ({ children }: any) => children,
    Textarea: el('textarea'),
    Wrap: el('div'),
    WrapItem: el('div'),
    Modal: ({ children, isOpen }: any) =>
      isOpen ? React.createElement(React.Fragment, null, children) : null,
    ModalOverlay: () => null,
    ModalContent: el('div'),
    ModalHeader: el('div'),
    ModalCloseButton: () => null,
    ModalBody: el('div'),
    ModalFooter: el('div'),
    useDisclosure: () => ({ isOpen: false, onOpen: jest.fn(), onClose: jest.fn() }),
    useToast: () => jest.fn(),
    ChakraProvider: ({ children }: any) => React.createElement(React.Fragment, null, children),
    extendTheme: (t: any) => t,
  };
});

jest.mock('@/components/Dashboard/MatchScoreRing', () => ({
  MatchScoreRing: () => null,
}));

jest.mock('@/components/Dashboard/AIReasoningBox', () => ({
  AIReasoningBox: () => null,
}));

jest.mock('@/utils/analytics', () => ({
  trackEvent: jest.fn(),
  initAnalytics: jest.fn(),
  trackPageView: jest.fn(),
  identifyUser: jest.fn(),
}));

jest.mock('@/utils/date-formatter', () => ({
  formatDate: () => 'Jan 10, 2026',
}));

jest.mock('@/utils/text-formatter', () => ({
  numberFormatter: (n: number) => String(n),
}));

jest.mock('@/utils/brief-utils', () => ({
  isSafeUrl: () => true,
}));

jest.mock('@/lib/apiClient', () => ({
  __esModule: true,
  createApiClient: jest.fn(() => ({
    markMatchClick: jest.fn().mockResolvedValue({}),
    markMatchAsSkipped: jest.fn().mockResolvedValue({}),
  })),
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import React from 'react';
import { render } from '@testing-library/react';
import JobListing from '@/components/Dashboard/JobListing';
import { getVerdictColor } from '@/utils/verdict-colors';
import type { JobResult } from '@/types/JobResult';

// ─── Fixture ──────────────────────────────────────────────────────────────────

const NO_MATCH_JOB: JobResult = {
  _id: 'match-nm-001',
  userId: 'user-test',
  jobId: 'job-nm-001',
  matchScore: 12,
  verdict: 'No match',
  reasoning: 'Skills and background do not align with this role.',
  clicked: false,
  skipped: false,
  applied: null,
  createdAt: '2026-01-15T10:00:00.000Z',
  updatedAt: '2026-01-15T10:00:00.000Z',
  job: {
    _id: 'job-nm-001',
    title: 'Senior Blockchain Engineer',
    company: 'CryptoFarm Ltd',
    location: ['Remote'],
    salary: { min: 80000, max: 120000, currency: 'USD', estimated: false },
    tags: ['blockchain', 'solidity'],
    source: 'linkedin',
    description: 'Build smart contracts for our DeFi protocol.',
    postedDate: '2026-01-10T00:00:00.000Z',
    scrapedDate: '2026-01-11T00:00:00.000Z',
    url: 'https://example.com/job/nm-001',
    createdAt: '2026-01-10T00:00:00.000Z',
    updatedAt: '2026-01-10T00:00:00.000Z',
  },
};

const RED_HEX_VALUES = ['#EF4444', '#ef4444', '#DC2626', '#dc2626', '#B91C1C', '#b91c1c'];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('G — JobListing: "No match" card accent/border uses grey (#6B7280), NOT red', () => {
  let container: HTMLElement;

  beforeEach(() => {
    const { container: c } = render(
      <JobListing
        job={NO_MATCH_JOB}
        openJobQuestionsDrawer={jest.fn()}
      />
    );
    container = c;
  });

  it('G-1: renders without crashing for "No match" verdict', () => {
    expect(container).toBeTruthy();
    expect(container.firstChild).not.toBeNull();
  });

  it('G-2: card has a data-accent-color element (left-border accent is applied via _before)', () => {
    // FINDING if null: the _before.background prop was not passed to Box,
    // or the component no longer applies the accent via _before
    const accentEl = container.querySelector('[data-accent-color]');
    expect(accentEl).not.toBeNull();
  });

  it('G-3: card accent/border color is grey #6B7280 [CORE ASSERTION]', () => {
    // FINDING if #EF4444: JobListing still derives border from an old red value for "No match"
    const accentEl = container.querySelector('[data-accent-color]');
    expect(accentEl).not.toBeNull();
    const accentColor = accentEl!.getAttribute('data-accent-color');
    expect(accentColor).toBe('#6B7280');
  });

  it('G-4: card accent/border color is NOT any shade of red', () => {
    const accentEl = container.querySelector('[data-accent-color]');
    const accentColor = accentEl?.getAttribute('data-accent-color') ?? '';
    for (const red of RED_HEX_VALUES) {
      expect(accentColor.toLowerCase()).not.toBe(red.toLowerCase());
    }
  });

  it('G-5: getVerdictColor("No match") used by JobListing returns grey', () => {
    // Verify the shared helper that JobListing calls is wired correctly.
    // If this fails together with G-3, the bug is in verdict-colors.ts.
    // If G-3 fails but G-5 passes, JobListing has a local override that bypasses the helper.
    expect(getVerdictColor('No match').hex).toBe('#6B7280');
    expect(getVerdictColor('No match').hex).not.toBe('#EF4444');
  });
});
