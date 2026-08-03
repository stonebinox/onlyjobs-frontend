/**
 * Smoke tests for kda-B: post-login default /today + /dashboard adapter.
 *
 * Phase 2a minimal suite — adversarial tests added separately.
 *
 * DISCLOSURE: read dashboard/index.tsx (adapter) and index.tsx (login
 * redirect effect) to understand their public contracts. No assertions
 * encode implementation internals — only the specified mapping rules
 * and the exported pure function signature.
 */

// ─── Mock control variables ───────────────────────────────────────────────────

let mockAuthState: { isReady: boolean; isLoggedIn: boolean };
const mockPush = jest.fn();
const mockReplace = jest.fn();

// ─── Mocks ────────────────────────────────────────────────────────────────────

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

jest.mock('next/script', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@chakra-ui/react', () => {
  const React = require('react');
  const cache: Record<string, any> = {};
  const makeEl = (tag: string) => {
    if (cache[tag]) return cache[tag];
    const C = React.forwardRef(
      ({ children, onClick, type, disabled, 'aria-label': al, href, role }: any, ref: any) =>
        React.createElement(tag, { ref, onClick, type, disabled, 'aria-label': al, href, role }, children)
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
    FormControl: makeEl('div'),
    FormLabel: makeEl('label'),
    Alert: makeEl('div'),
    AlertIcon: () => null,
    AlertTitle: makeEl('span'),
    AlertDescription: makeEl('span'),
    Badge: makeEl('span'),
    List: makeEl('ul'),
    ListItem: makeEl('li'),
    ListIcon: () => null,
    Spinner: () =>
      React.createElement('div', { role: 'status', 'aria-label': 'Loading' }),
    Link: ({ children, href }: any) => React.createElement('a', { href }, children),
    useDisclosure: () => ({ isOpen: false, onOpen: jest.fn(), onClose: jest.fn() }),
    useToast: () => jest.fn(),
    useBreakpointValue: (vals: any) =>
      vals && typeof vals === 'object' ? vals.base ?? Object.values(vals)[0] : vals,
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

jest.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: () => mockAuthState,
}));

jest.mock('@/contexts/GuideContext', () => ({
  GuideProvider: ({ children }: any) => children,
  useGuide: () => ({ showGuide: false }),
}));

jest.mock('@/utils/analytics', () => ({
  trackEvent: jest.fn(),
  initAnalytics: jest.fn(),
  trackPageView: jest.fn(),
  identifyUser: jest.fn(),
}));

jest.mock('@/components/CookieConsent', () => ({
  CookieConsent: () => null,
}));

jest.mock('@/components/SEO', () => ({
  SEO: () => null,
}));

jest.mock('@/components/Footer', () => ({
  Footer: () => null,
}));

jest.mock('@/components/Layout/DashboardLayout', () => ({
  __esModule: true,
  default: ({ children }: any) => React.createElement(React.Fragment, null, children),
}));

jest.mock('@emotion/react', () => ({
  keyframes: () => 'mock-keyframes',
  css: (...args: any[]) => args,
}));

jest.mock('react-icons/fi', () => ({
  FiCheck: () => null,
  FiUpload: () => null,
  FiTarget: () => null,
  FiZap: () => null,
  FiMessageCircle: () => null,
  FiBriefcase: () => null,
  FiCheckCircle: () => null,
  FiTrendingUp: () => null,
  FiMessageSquare: () => null,
}));

jest.mock('react-icons/tb', () => ({
  TbSparkles: () => null,
}));

// Stub heavy homepage sub-components so index.tsx can render under jest
jest.mock('@/lib/apiClient', () => ({
  __esModule: true,
  createApiClient: jest.fn(() => ({
    getPublicStats: jest.fn().mockResolvedValue(null),
    authenticateUser: jest.fn().mockResolvedValue({}),
    requestPasswordReset: jest.fn().mockResolvedValue({}),
  })),
}));

// ─── Global fetch stub (index.tsx calls fetch directly for public stats) ──────
// fetch is not in jsdom; stub it globally so the stats effect runs silently.
global.fetch = jest.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve(null) }) as any;

// ─── Imports (after all jest.mock calls) ─────────────────────────────────────

import React from 'react';
import { render, act } from '@testing-library/react';
import { resolveDashboardRedirect } from '@/pages/dashboard/index';
import DashboardRedirect from '@/pages/dashboard/index';

// ─── Unit tests: resolveDashboardRedirect ─────────────────────────────────────

describe('resolveDashboardRedirect — pure function', () => {
  it('tab=applied + followup=true → /tracker?followup=true', () => {
    expect(resolveDashboardRedirect('?tab=applied&followup=true')).toBe('/tracker?followup=true');
  });

  it('tab=applied (no followup) → /tracker', () => {
    expect(resolveDashboardRedirect('?tab=applied')).toBe('/tracker');
  });

  it('empty search → /today', () => {
    expect(resolveDashboardRedirect('')).toBe('/today');
  });

  it('tab=matches → /today', () => {
    expect(resolveDashboardRedirect('?tab=matches')).toBe('/today');
  });

  it('tab=viewed → /today', () => {
    expect(resolveDashboardRedirect('?tab=viewed')).toBe('/today');
  });

  it('tab=skipped → /today', () => {
    expect(resolveDashboardRedirect('?tab=skipped')).toBe('/today');
  });

  it('tab=alljobs → /browse', () => {
    expect(resolveDashboardRedirect('?tab=alljobs')).toBe('/browse');
  });

  it('unknown tab → /today', () => {
    expect(resolveDashboardRedirect('?tab=unknown_tab_xyz')).toBe('/today');
  });

  it('tab=applied + followup=false (not "true") → /tracker (no followup param)', () => {
    expect(resolveDashboardRedirect('?tab=applied&followup=false')).toBe('/tracker');
  });
});

// ─── Component: /dashboard adapter ────────────────────────────────────────────

describe('/dashboard adapter component', () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it('calls router.replace with /tracker?followup=true for ?tab=applied&followup=true', async () => {
    Object.defineProperty(window, 'location', {
      value: { search: '?tab=applied&followup=true' },
      writable: true,
      configurable: true,
    });

    await act(async () => {
      render(<DashboardRedirect />);
    });

    expect(mockReplace).toHaveBeenCalledWith('/tracker?followup=true');
    expect(mockReplace).toHaveBeenCalledTimes(1);
  });

  it('calls router.replace with /today for empty search', async () => {
    Object.defineProperty(window, 'location', {
      value: { search: '' },
      writable: true,
      configurable: true,
    });

    await act(async () => {
      render(<DashboardRedirect />);
    });

    expect(mockReplace).toHaveBeenCalledWith('/today');
    expect(mockReplace).toHaveBeenCalledTimes(1);
  });

  it('renders a Spinner while redirecting (no content rendered)', async () => {
    Object.defineProperty(window, 'location', {
      value: { search: '' },
      writable: true,
      configurable: true,
    });

    const { getByRole } = render(<DashboardRedirect />);
    expect(getByRole('status')).toBeInTheDocument();
  });

  it('does NOT call createApiClient (no backend fetch)', async () => {
    const { createApiClient } = require('@/lib/apiClient');
    createApiClient.mockClear();

    Object.defineProperty(window, 'location', {
      value: { search: '?tab=applied' },
      writable: true,
      configurable: true,
    });

    await act(async () => {
      render(<DashboardRedirect />);
    });

    expect(createApiClient).not.toHaveBeenCalled();
  });
});

// ─── Login redirect (index.tsx) ───────────────────────────────────────────────

describe('index.tsx login redirect', () => {
  beforeEach(() => {
    mockPush.mockClear();
    // Clean sessionStorage between tests
    sessionStorage.clear();
    // Default: no returnTo in URL
    Object.defineProperty(window, 'location', {
      value: { search: '', origin: 'http://localhost' },
      writable: true,
      configurable: true,
    });
  });

  it('pushes /today when user is logged in with no returnTo', async () => {
    mockAuthState = { isReady: true, isLoggedIn: true };

    // Dynamically import index after mocks are set up
    const IndexPage = (await import('@/pages/index')).default;

    await act(async () => {
      render(<IndexPage />);
    });

    expect(mockPush).toHaveBeenCalledWith('/today');
  });

  it('pushes returnTo when valid returnTo=/tracker is provided', async () => {
    mockAuthState = { isReady: true, isLoggedIn: true };
    Object.defineProperty(window, 'location', {
      value: { search: '?returnTo=%2Ftracker', origin: 'http://localhost' },
      writable: true,
      configurable: true,
    });

    const IndexPage = (await import('@/pages/index')).default;

    await act(async () => {
      render(<IndexPage />);
    });

    expect(mockPush).toHaveBeenCalledWith('/tracker');
  });

  it('falls through to /today when returnTo=//evil.com (open-redirect guard)', async () => {
    mockAuthState = { isReady: true, isLoggedIn: true };
    Object.defineProperty(window, 'location', {
      value: { search: '?returnTo=%2F%2Fevil.com', origin: 'http://localhost' },
      writable: true,
      configurable: true,
    });

    const IndexPage = (await import('@/pages/index')).default;

    await act(async () => {
      render(<IndexPage />);
    });

    expect(mockPush).toHaveBeenCalledWith('/today');
    expect(mockPush).not.toHaveBeenCalledWith('//evil.com');
  });
});
