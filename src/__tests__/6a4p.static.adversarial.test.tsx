/**
 * 6a4p ADVERSARIAL: R9 (ViewContent on sample-match-report), R12 (footer legal links are plain
 * anchors), R13 (privacy copy + no em/en dashes in privacy page and cookie banner).
 * Pages/components are black boxes. Real styled-components; next/link is mocked to a MARKED anchor
 * so a Next <Link> (client-side nav) is distinguishable from a plain <a> (full page load).
 */
process.env.NEXT_PUBLIC_META_PIXEL_ID = '222000111222333';

import React from 'react';
import { render, act, cleanup } from '@testing-library/react';
import { installFbqRecorder, FbqRecorder, setUrl } from './6a4p.helpers';

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(), replace: jest.fn(), prefetch: jest.fn(), pathname: '/', query: {}, asPath: '/',
    events: { on: jest.fn(), off: jest.fn() }, isReady: true,
  }),
}));
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock('next/head', () => ({
  __esModule: true,
  default: ({ children }: any) => require('react').createElement(require('react').Fragment, null, children),
}));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...rest }: any) =>
    require('react').createElement('a', { 'data-next-link': 'true', href: typeof href === 'string' ? href : href?.pathname, ...rest }, children),
}));
jest.mock('@/theme/theme', () => ({ __esModule: true, default: { colors: { semantic: { primary: '#000' } } } }));
const nullIcon = () => null;
jest.mock('react-icons/fi', () => new Proxy({}, { get: () => nullIcon }));
jest.mock('react-icons/bs', () => new Proxy({}, { get: () => nullIcon }));
jest.mock('react-icons/si', () => new Proxy({}, { get: () => nullIcon }));
jest.mock('react-icons/fa', () => new Proxy({}, { get: () => nullIcon }));
jest.mock('@chakra-ui/react', () => {
  const React = require('react');
  const cache: Record<string, any> = {};
  const makeEl = (tag: string) => {
    if (cache[tag]) return cache[tag];
    const C = React.forwardRef(({ children, as: As, href, onClick, ...rest }: any, ref: any) => {
      const T = typeof As === 'string' ? As : tag;
      const props: any = { ref };
      if (href !== undefined) props.href = href;
      if (onClick) props.onClick = onClick;
      if (typeof rest['aria-label'] === 'string') props['aria-label'] = rest['aria-label'];
      return React.createElement(T, props, children);
    });
    C.displayName = tag;
    cache[tag] = C;
    return C;
  };
  return new Proxy(
    {
      __esModule: true,
      Link: ({ children, href, onClick }: any) => React.createElement('a', { href, onClick }, children),
      Heading: ({ as: T = 'h2', children }: any) => React.createElement(T, null, children),
      Text: makeEl('span'),
      Button: makeEl('button'),
      Divider: () => React.createElement('hr'),
      useColorModeValue: (l: any) => l,
      useDisclosure: () => ({ isOpen: false, onOpen: jest.fn(), onClose: jest.fn(), onToggle: jest.fn() }),
      useBreakpointValue: (v: any) => (v && typeof v === 'object' ? v.base ?? Object.values(v)[0] : v),
      useToast: () => jest.fn(),
    },
    {
      get(t: any, p: any) {
        if (p in t) return t[p];
        if (typeof p === 'string') {
          if (p.startsWith('use')) { cache[`h:${p}`] = cache[`h:${p}`] || (() => ({})); return cache[`h:${p}`]; }
          return makeEl('div');
        }
        return t[p];
      },
    },
  );
});

import { Footer } from '@/components/Footer';
import { CookieConsent } from '@/components/CookieConsent';
import PrivacyPolicyPage from '@/pages/privacy-policy';
import SampleMatchReportPage from '@/pages/sample-match-report';

let rec: FbqRecorder;
beforeAll(() => { rec = installFbqRecorder(); });
afterAll(() => rec.restore());
beforeEach(() => {
  rec.calls.length = 0;
  sessionStorage.clear();
  localStorage.clear();
  window.matchMedia = window.matchMedia || (((q: string) => ({ matches: false, media: q, addEventListener: jest.fn(), removeEventListener: jest.fn(), addListener: jest.fn(), removeListener: jest.fn(), onchange: null, dispatchEvent: jest.fn() })) as any);
  (window as any).scrollTo = jest.fn();
});
afterEach(() => { cleanup(); setUrl('/'); });

const bodyText = (c: HTMLElement) => (c.textContent || '').replace(/\s+/g, ' ');

describe('R9 ViewContent on /sample-match-report', () => {
  it('fires fbq track ViewContent on mount (never trackCustom)', async () => {
    setUrl('/sample-match-report');
    await act(async () => { render(<SampleMatchReportPage />); });
    const vc = rec.calls.filter((c) => c[0] === 'track' && c[1] === 'ViewContent');
    expect(vc).toHaveLength(1);
    expect(rec.calls.filter((c) => c[0] === 'trackCustom' && /ViewContent/.test(String(c[1])))).toHaveLength(0);
  });

  it('re-render does not fire ViewContent again (mount-only)', async () => {
    setUrl('/sample-match-report');
    let r!: ReturnType<typeof render>;
    await act(async () => { r = render(<SampleMatchReportPage />); });
    await act(async () => { r.rerender(<SampleMatchReportPage />); });
    await act(async () => { r.rerender(<SampleMatchReportPage />); });
    expect(rec.calls.filter((c) => c[0] === 'track' && c[1] === 'ViewContent')).toHaveLength(1);
  });

  it('ViewContent params contain no PII or token-like data', async () => {
    setUrl('/sample-match-report');
    await act(async () => { render(<SampleMatchReportPage />); });
    const vc = rec.calls.filter((c) => c[0] === 'track' && c[1] === 'ViewContent');
    expect(JSON.stringify(vc)).not.toMatch(/@|token|password/i);
  });
});

describe('R12 footer legal links are plain anchors (full page load)', () => {
  const LEGAL = ['/privacy-policy', '/terms-conditions', '/refund-policy'];

  const check = (container: HTMLElement) => {
    for (const href of LEGAL) {
      const anchors = Array.from(container.querySelectorAll(`a[href="${href}"]`));
      expect(anchors.length).toBeGreaterThan(0);
      for (const a of anchors) {
        expect(a.hasAttribute('data-next-link')).toBe(false);
        expect(a.tagName).toBe('A');
        let prevented = false;
        const listener = (e: Event) => { prevented = e.defaultPrevented; e.preventDefault(); };
        document.addEventListener('click', listener);
        a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        document.removeEventListener('click', listener);
        expect(prevented).toBe(false);
      }
    }
  };

  it('full footer: privacy, terms, refund links are unmarked <a href> and clicks are not intercepted', () => {
    const { container } = render(<Footer />);
    check(container);
  });

  it('minimal footer: any legal links present are also plain anchors', () => {
    const { container } = render(<Footer minimal />);
    for (const href of LEGAL) {
      for (const a of Array.from(container.querySelectorAll(`a[href="${href}"]`))) {
        expect(a.hasAttribute('data-next-link')).toBe(false);
      }
    }
  });

  it('non-legal footer links are not required to be plain (sanity: the marker mock does mark Next links elsewhere in the app)', () => {
    // Guards against a vacuous pass: the marker must exist for a real next/link render.
    const NextLink = require('next/link').default;
    const { container } = render(<NextLink href="/x">x</NextLink>);
    expect(container.querySelector('a[data-next-link]')).not.toBeNull();
  });

  it('no legal link in the footer points at an absolute/different URL', () => {
    const { container } = render(<Footer />);
    const hrefs = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href') || '');
    for (const p of LEGAL) expect(hrefs).toContain(p);
  });
});

describe('R13 copy', () => {
  it('privacy page: old "no advertising pixels" sentence is gone (case-insensitive, whitespace-normalised)', () => {
    const { container } = render(<PrivacyPolicyPage />);
    const t = bodyText(container).toLowerCase();
    expect(t.length).toBeGreaterThan(500);
    expect(t).not.toContain('we run no advertising pixels or third-party ad trackers');
    expect(t).not.toMatch(/no advertising pixels/);
  });

  it('privacy page mentions Meta Pixel and Conversions API', () => {
    const { container } = render(<PrivacyPolicyPage />);
    const t = bodyText(container);
    expect(t).toMatch(/Meta Pixel/i);
    expect(t).toMatch(/Conversions API/i);
  });

  it('privacy page has no em dash (U+2014) or en dash (U+2013)', () => {
    const { container } = render(<PrivacyPolicyPage />);
    expect(bodyText(container)).not.toMatch(/[–—]/);
  });

  it('cookie banner renders text and has no em/en dash', () => {
    const { container } = render(<CookieConsent />);
    const t = bodyText(container);
    expect(t.length).toBeGreaterThan(20); // non-vacuous: banner actually shown
    expect(t).not.toMatch(/[–—]/);
  });

  it('cookie banner does not claim there are no ad trackers/pixels (would contradict Meta Pixel)', () => {
    const { container } = render(<CookieConsent />);
    expect(bodyText(container).toLowerCase()).not.toMatch(/no advertising|no ad tracker|no tracking pixel|no pixels/);
  });
});
