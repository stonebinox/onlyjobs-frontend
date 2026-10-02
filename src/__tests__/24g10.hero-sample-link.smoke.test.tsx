/**
 * Smoke test — onlyjobs-24g.10: hero sample match report link
 *
 * Phase 2a minimal suite. Adversarial suite authored separately.
 *
 * Coverage:
 *   A — element with data-testid="hero-sample-match-report" exists in DOM
 *   B — href is exactly "/sample-match-report"
 *   C — element is NOT a descendant of #signup
 */

// ── Mock control ──────────────────────────────────────────────────────────────

const mockPush = jest.fn();
const mockReplace = jest.fn();

// ── Mocks ──────────────────────────────────────────────────────────────────────

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('next/router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
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
      ({ children, onClick, type, disabled, 'aria-label': al, href, role, id, 'data-testid': dt, ...rest }: any, ref: any) =>
        React.createElement(tag, { ref, onClick, type, disabled, 'aria-label': al, href, role, id, 'data-testid': dt }, children)
    );
    C.displayName = tag;
    cache[tag] = C;
    return C;
  };
  const known: Record<string, any> = {
    __esModule: true,
    Box: makeEl('div'),
    Flex: makeEl('div'),
    Center: makeEl('div'),
    Container: makeEl('div'),
    VStack: makeEl('div'),
    HStack: makeEl('div'),
    Stack: makeEl('div'),
    SimpleGrid: makeEl('div'),
    Text: makeEl('span'),
    Heading: makeEl('h2'),
    Button: makeEl('button'),
    Input: makeEl('input'),
    Badge: makeEl('span'),
    List: makeEl('ul'),
    ListItem: makeEl('li'),
    ListIcon: () => null,
    useColorModeValue: (light: any) => light,
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
jest.mock('@/theme/palette', () => ({ PENCIL: '#333' }));

jest.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: () => ({ isReady: true, isLoggedIn: false }),
}));

jest.mock('@/utils/analytics', () => ({
  trackEvent: jest.fn(),
  initAnalytics: jest.fn(),
  trackPageView: jest.fn(),
  identifyUser: jest.fn(),
}));

jest.mock('@/utils/safe-return-to', () => ({
  isSafeReturnTo: () => false,
}));

jest.mock('@/components/Footer', () => ({
  Footer: () => null,
}));

jest.mock('@/components/JsonLd', () => ({
  JsonLd: () => null,
}));

jest.mock('@/components/Logo', () => ({
  Logo: () => null,
}));

jest.mock('@/components/SEO', () => ({
  SEO: () => null,
}));

jest.mock('@emotion/react', () => ({
  keyframes: () => 'mock-keyframes',
  css: (...args: any[]) => args,
}));

jest.mock('react-icons/fi', () => new Proxy({}, { get: () => () => null }));
jest.mock('react-icons/tb', () => new Proxy({}, { get: () => () => null }));

// ── Imports (after all jest.mock calls) ───────────────────────────────────────

import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '@/pages/index';

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('24g.10 — hero sample match report link', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  it('A: element with data-testid="hero-sample-match-report" exists in DOM', () => {
    render(<Home />);
    expect(screen.getByTestId('hero-sample-match-report')).toBeInTheDocument();
  });

  it('B: href is exactly "/sample-match-report"', () => {
    render(<Home />);
    const el = screen.getByTestId('hero-sample-match-report');
    expect(el).toHaveAttribute('href', '/sample-match-report');
  });

  it('C: element is NOT a descendant of #signup', () => {
    render(<Home />);
    const el = screen.getByTestId('hero-sample-match-report');
    expect(el.closest('#signup')).toBeNull();
  });
});
