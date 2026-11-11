/**
 * 6a4p ADVERSARIAL: _app wiring of pixel PageViews (R1, R3, R4). _app is a black box.
 */
import { installFbqRecorder, fbeventsScripts, anyPixelScript, resetPixelDom, setUrl, FbqRecorder } from './6a4p.helpers';

const handlers = new Map<string, Set<(...a: any[]) => void>>();
const routerObj: any = {
  asPath: '/',
  pathname: '/',
  query: {},
  isReady: true,
  push: jest.fn(),
  replace: jest.fn(),
  events: {
    on: (evt: string, fn: any) => { if (!handlers.has(evt)) handlers.set(evt, new Set()); handlers.get(evt)!.add(fn); },
    off: (evt: string, fn: any) => { handlers.get(evt)?.delete(fn); },
    emit: jest.fn(),
  },
};

jest.mock('next/router', () => ({
  __esModule: true,
  useRouter: () => routerObj,
  default: routerObj,
}));
jest.mock('next/head', () => ({ __esModule: true, default: ({ children }: any) => require('react').createElement(require('react').Fragment, null, children) }));
jest.mock('next/script', () => ({
  __esModule: true,
  default: ({ src, children }: any) => require('react').createElement('script', { 'data-nextscript': true, src }, children),
}));
jest.mock('@chakra-ui/react', () => ({
  __esModule: true,
  ChakraProvider: ({ children }: any) => require('react').createElement(require('react').Fragment, null, children),
}));
jest.mock('@/theme/theme', () => ({ __esModule: true, default: {} }));
jest.mock('@/contexts/AuthContext', () => ({ AuthProvider: ({ children }: any) => require('react').createElement(require('react').Fragment, null, children) }));
jest.mock('@/contexts/GuideContext', () => ({ GuideProvider: ({ children }: any) => require('react').createElement(require('react').Fragment, null, children) }));
jest.mock('@/utils/analytics', () => ({ initAnalytics: jest.fn(), trackPageView: jest.fn() }));
jest.mock('@/components/CookieConsent', () => ({ CookieConsent: () => null }));

let React: typeof import('react');
let RDC: typeof import('react-dom/client');
let act: (fn: () => void) => void;
let roots: any[] = [];
let MyApp: any;
/** Fresh module registry per test: pixel init/dedupe state is module-level (== one page session). */
function freshModules() {
  jest.isolateModules(() => {
    React = require('react');
    RDC = require('react-dom/client');
    act = require('react-dom/test-utils').act;
    MyApp = require('@/pages/_app').default;
  });
}

const PIXEL_ID = '777000111222333';
let rec: FbqRecorder;
const Stub = () => null;

function mount(url: string, strict = false) {
  setUrl(url);
  routerObj.asPath = url;
  routerObj.pathname = url.split('?')[0];
  const el = React.createElement(MyApp, { Component: Stub, pageProps: {}, router: routerObj });
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = RDC.createRoot(container);
  roots.push(root);
  act(() => { root.render(strict ? React.createElement(React.StrictMode, null, el) : el); });
  return { unmount: () => act(() => root.unmount()) };
}
function navigate(url: string) {
  setUrl(url);
  routerObj.asPath = url;
  routerObj.pathname = url.split('?')[0];
  act(() => {
    Array.from(handlers.get('routeChangeComplete') ?? []).forEach((h) => h(url, { shallow: false }));
  });
}
const pv = () => rec.calls.filter((c) => c[0] === 'track' && c[1] === 'PageView');
const inits = () => rec.calls.filter((c) => c[0] === 'init');

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

beforeEach(() => {
  handlers.clear();
  resetPixelDom();
  rec = installFbqRecorder();
  process.env.NEXT_PUBLIC_META_PIXEL_ID = PIXEL_ID;
  freshModules();
});
afterEach(() => {
  roots.forEach((r) => { try { act(() => r.unmount()); } catch { /* ignore */ } });
  roots = [];
  document.body.innerHTML = '';
  rec.restore();
  delete process.env.NEXT_PUBLIC_META_PIXEL_ID;
  setUrl('/');
});

describe('R1 via _app', () => {
  it('env unset: mount + route changes never create script or window.fbq', () => {
    delete process.env.NEXT_PUBLIC_META_PIXEL_ID;
    mount('/today');
    navigate('/pricing');
    navigate('/browse');
    expect(fbeventsScripts()).toHaveLength(0);
    expect(anyPixelScript().filter((s) => !s.hasAttribute('data-seed'))
      .filter((s) => /facebook|fbevents|fbq/.test(s.outerHTML))).toHaveLength(0);
    expect(rec.current).toBeUndefined();
    expect(rec.calls).toHaveLength(0);
  });
});

describe('R4 PageView wiring', () => {
  it('eligible initial load: exactly one init and exactly one PageView', () => {
    mount('/today');
    expect(inits()).toHaveLength(1);
    expect(inits()[0]).toEqual(['init', PIXEL_ID]);
    expect(pv()).toHaveLength(1);
    expect(fbeventsScripts()).toHaveLength(1);
  });

  it('eligible initial load under StrictMode (double effects): still exactly one PageView and one init', () => {
    mount('/today', true);
    expect(inits()).toHaveLength(1);
    expect(pv()).toHaveLength(1);
    expect(fbeventsScripts()).toHaveLength(1);
  });

  it('each eligible client-side route change adds exactly one PageView', () => {
    mount('/today');
    navigate('/pricing');
    expect(pv()).toHaveLength(2);
    navigate('/browse');
    expect(pv()).toHaveLength(3);
    expect(inits()).toHaveLength(1);
  });

  it('StrictMode: a single route change still yields exactly one extra PageView (no duplicate listeners)', () => {
    mount('/today', true);
    const before = pv().length;
    navigate('/pricing');
    expect(pv().length - before).toBe(1);
  });

  it('route change to a denylisted URL emits nothing; returning to eligible resumes', () => {
    mount('/today');
    navigate('/privacy-policy');
    navigate('/terms-conditions/');
    navigate('/refund-policy');
    navigate('/verify-email');
    navigate('/reset-password');
    navigate('/today?token=abc');
    expect(pv()).toHaveLength(1);
    navigate('/pricing');
    expect(pv()).toHaveLength(2);
    expect(inits()).toHaveLength(1);
  });

  it('PageView carries no URL/query data (no token or email leak in any fbq arg)', () => {
    mount('/today?email=a@b.com');
    navigate('/pricing?email=x@y.com');
    expect(JSON.stringify(rec.calls)).not.toMatch(/@|token/);
  });
});

describe('R3 denylisted first load then SPA navigation', () => {
  it.each([
    '/reset-password?token=abc',
    '/reset-password',
    '/verify-email?token=abc',
    '/verify-email',
    '/privacy-policy',
    '/terms-conditions',
    '/refund-policy/',
    '/today?token=zzz',
    '/today?TOKEN=zzz',
  ])('first load %s: nothing; first eligible nav inits once + one PageView', (first) => {
    mount(first);
    expect(rec.calls).toHaveLength(0);
    expect(fbeventsScripts()).toHaveLength(0);
    expect(rec.current).toBeUndefined();

    navigate('/today');
    expect(inits()).toHaveLength(1);
    expect(pv()).toHaveLength(1);
    expect(fbeventsScripts()).toHaveLength(1);

    navigate('/pricing');
    expect(inits()).toHaveLength(1);
    expect(pv()).toHaveLength(2);
  });

  it('denylisted first load then denylisted nav then eligible nav: still a single init and PageView', () => {
    mount('/reset-password?token=abc');
    navigate('/verify-email');
    navigate('/privacy-policy');
    expect(rec.calls).toHaveLength(0);
    navigate('/');
    expect(inits()).toHaveLength(1);
    expect(pv()).toHaveLength(1);
  });

  it('StrictMode + denylisted first load: still nothing fired', () => {
    mount('/reset-password?token=abc', true);
    expect(rec.calls).toHaveLength(0);
    expect(fbeventsScripts()).toHaveLength(0);
  });

  it('unmount removes route listeners (no PageView after unmount)', () => {
    const r = mount('/today');
    r.unmount();
    navigate('/pricing');
    expect(pv()).toHaveLength(1);
  });
});
