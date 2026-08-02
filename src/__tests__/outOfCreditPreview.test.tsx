jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock('next/head', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...rest }: any) =>
    React.createElement('a', { href, ...rest }, children),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: any) => React.createElement('img', { src, alt }),
}));

jest.mock('@chakra-ui/react', () => {
  const React = require('react');

  const cache: Record<string, any> = {};
  const makeEl = (tag: string) => {
    if (cache[tag]) return cache[tag];
    const C = React.forwardRef(
      ({ children, onClick, type, disabled, 'aria-label': al, href, ...rest }: any, ref: any) =>
        React.createElement(tag, { ref, onClick, type, disabled, 'aria-label': al, href }, children)
    );
    C.displayName = tag;
    cache[tag] = C;
    return C;
  };

  const known: Record<string, any> = {
    __esModule: true,
    Box: makeEl('div'),
    Flex: makeEl('div'),
    VStack: makeEl('div'),
    HStack: makeEl('div'),
    Text: makeEl('span'),
    Heading: makeEl('h3'),
    Button: makeEl('button'),
    Link: ({ children, href, onClick, ...p }: any) =>
      React.createElement('a', { href, onClick }, children),
    useColorModeValue: (light: any) => light,
    useDisclosure: () => ({ isOpen: false, onOpen: jest.fn(), onClose: jest.fn() }),
    useToast: () => jest.fn(),
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

// ─── Imports ─────────────────────────────────────────────────────────────────

import React from 'react';
import { render, screen } from '@testing-library/react';
import { OutOfCreditPreview } from '@/components/Dashboard/OutOfCreditPreview';
import type { OutOfCreditPreviewResponse } from '@/lib/apiClient';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makePreview = (overrides: Partial<OutOfCreditPreviewResponse> = {}): OutOfCreditPreviewResponse => ({
  shouldShow: true,
  reason: 'auto_low_balance',
  walletBalance: 0.10,
  dailyMatchCost: 0.3,
  onDemandMatchCost: 0.05,
  count: 3,
  candidates: [
    {
      title: 'Senior Engineer',
      company: 'Acme Corp',
      location: ['Remote'],
      salary: { min: 100000, max: 150000, currency: 'USD' },
      postedDate: new Date().toISOString(),
    },
    {
      title: 'Frontend Dev',
      company: 'Beta Inc',
      location: ['New York'],
      salary: { min: 80000, max: 120000, currency: 'USD' },
      postedDate: new Date().toISOString(),
    },
  ],
  ...overrides,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('OutOfCreditPreview', () => {
  // 1. When shouldShow is false → renders nothing
  describe('when shouldShow is false', () => {
    it('renders nothing when preview.shouldShow is false', () => {
      const preview = makePreview({ shouldShow: false, reason: 'sufficient_balance' });
      const { container } = render(<OutOfCreditPreview preview={preview} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when preview is null', () => {
      const { container } = render(<OutOfCreditPreview preview={null} />);
      expect(container.firstChild).toBeNull();
    });
  });

  // 2. When shouldShow is true with count > 0 → shows count and candidates
  describe('when shouldShow is true with count > 0', () => {
    it('shows the job count in the heading', () => {
      render(<OutOfCreditPreview preview={makePreview({ count: 3 })} />);
      expect(screen.getByText(/3 unscored jobs in your 15-day queue/i)).toBeInTheDocument();
    });

    it('shows candidate job titles', () => {
      render(<OutOfCreditPreview preview={makePreview()} />);
      expect(screen.getByText('Senior Engineer')).toBeInTheDocument();
      expect(screen.getByText('Frontend Dev')).toBeInTheDocument();
    });

    it('shows candidate company names', () => {
      render(<OutOfCreditPreview preview={makePreview()} />);
      expect(screen.getByText(/Acme Corp/)).toBeInTheDocument();
    });

    it('does NOT show the old generic "Low Wallet Balance" text', () => {
      render(<OutOfCreditPreview preview={makePreview()} />);
      expect(screen.queryByText(/low wallet balance/i)).not.toBeInTheDocument();
    });

    it('shows a link to /wallet', () => {
      render(<OutOfCreditPreview preview={makePreview()} />);
      const walletLink = document.querySelector('a[href="/wallet"]');
      expect(walletLink).not.toBeNull();
    });

    it('shows "Add funds" button', () => {
      render(<OutOfCreditPreview preview={makePreview()} />);
      expect(screen.getByText(/add funds/i)).toBeInTheDocument();
    });

    it('uses correct copy — "unscored jobs in your 15-day queue", not "matches"', () => {
      render(<OutOfCreditPreview preview={makePreview({ count: 5 })} />);
      expect(screen.getByText(/unscored jobs in your 15-day queue/i)).toBeInTheDocument();
      expect(screen.queryByText(/\bmatches\b/i)).not.toBeInTheDocument();
    });

    it('does not say "since your credit ran out"', () => {
      render(<OutOfCreditPreview preview={makePreview()} />);
      expect(screen.queryByText(/since your credit ran out/i)).not.toBeInTheDocument();
    });

    it('does not say "we found these for you" or "we picked these"', () => {
      render(<OutOfCreditPreview preview={makePreview()} />);
      expect(screen.queryByText(/we found these for you/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/we picked these/i)).not.toBeInTheDocument();
    });
  });

  // 3. When shouldShow is true with count === 0 → appropriate copy, no candidates
  describe('when shouldShow is true with count === 0', () => {
    it('shows appropriate copy when queue is empty', () => {
      render(<OutOfCreditPreview preview={makePreview({ count: 0, candidates: [] })} />);
      expect(screen.getByText(/no jobs in your queue match your current filters/i)).toBeInTheDocument();
    });

    it('does not render any candidate cards when count is 0', () => {
      render(<OutOfCreditPreview preview={makePreview({ count: 0, candidates: [] })} />);
      expect(screen.queryByText('Senior Engineer')).not.toBeInTheDocument();
    });

    it('still shows the Add funds link when count is 0', () => {
      render(<OutOfCreditPreview preview={makePreview({ count: 0, candidates: [] })} />);
      expect(screen.getByText(/add funds/i)).toBeInTheDocument();
    });
  });

  // On-demand note appears only when balance is in [0.05, 0.30)
  describe('on-demand note', () => {
    it('shows on-demand note when balance is in [0.05, 0.30)', () => {
      render(<OutOfCreditPreview preview={makePreview({ walletBalance: 0.10, onDemandMatchCost: 0.05 })} />);
      expect(screen.getByText(/on-demand analysis/i)).toBeInTheDocument();
    });

    it('does not show on-demand note when balance is below onDemandMatchCost', () => {
      render(<OutOfCreditPreview preview={makePreview({ walletBalance: 0.01, onDemandMatchCost: 0.05 })} />);
      expect(screen.queryByText(/on-demand analysis/i)).not.toBeInTheDocument();
    });
  });
});
