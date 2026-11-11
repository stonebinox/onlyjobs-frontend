/**
 * 6a4p ADVERSARIAL: metaPixel module (R1-R5). Black-box via public exports only.
 * Oracle: bd task requirements R1-R5 (see task prompt). Failures are findings.
 */
import {
  installFbqRecorder, fbeventsScripts, anyPixelScript, resetPixelDom, setUrl, FbqRecorder,
} from './6a4p.helpers';

const PIXEL_ID = '999000111222333';
const MDM_ID = '1102526175579807';

type PixelMod = typeof import('../lib/metaPixel');

let rec: FbqRecorder;

const UNSET = Symbol('unset');
function load(envId: string | typeof UNSET = PIXEL_ID): PixelMod {
  if (envId === UNSET) delete process.env.NEXT_PUBLIC_META_PIXEL_ID;
  else process.env.NEXT_PUBLIC_META_PIXEL_ID = envId;
  let mod!: PixelMod;
  jest.isolateModules(() => {
    mod = require('../lib/metaPixel');
  });
  return mod;
}

const callsOf = (name: string) => rec.calls.filter((c) => c[0] === name);
const tracks = (evt: string) => rec.calls.filter((c) => c[0] === 'track' && c[1] === evt);

beforeEach(() => {
  resetPixelDom();
  rec = installFbqRecorder();
});
afterEach(() => {
  rec.restore();
  setUrl('/');
  delete process.env.NEXT_PUBLIC_META_PIXEL_ID;
  jest.restoreAllMocks();
});

describe('R1 env gate', () => {
  it.each(['unset', ''])('no script, no fbq, ensurePixel false when env=%p', (env) => {
    const m = load(env === 'unset' ? UNSET : '');
    expect(m.ensurePixel('/today')).toBe(false);
    m.trackPixelPageView('/today');
    m.trackPixelEvent('Purchase', { value: 1, currency: 'USD' }, 'purchase_1');
    m.trackPixelCustomEvent('Activated', {}, 'act_1');
    expect(fbeventsScripts()).toHaveLength(0);
    expect(anyPixelScript()).toHaveLength(0);
    expect(rec.current).toBeUndefined();
    expect(rec.calls).toHaveLength(0);
  });

  it('whitespace-only env is treated as unset (no pixel)', () => {
    const m = load('   ');
    expect(m.ensurePixel('/today')).toBe(false);
    expect(fbeventsScripts()).toHaveLength(0);
    expect(rec.calls).toHaveLength(0);
  });

  it('never uses the hardcoded MDM id when env is unset', () => {
    const m = load(UNSET);
    m.ensurePixel('/today');
    m.trackPixelPageView('/today');
    const everything = JSON.stringify(rec.calls) + document.documentElement.outerHTML;
    expect(everything).not.toContain(MDM_ID);
  });

  it('with env set: loads a connect.facebook.net fbevents.js script exactly once and inits with the env id (not MDM id)', () => {
    const m = load();
    expect(m.ensurePixel('/today')).toBe(true);
    m.ensurePixel('/today');
    m.ensurePixel('/pricing');
    const s = fbeventsScripts();
    expect(s).toHaveLength(1);
    expect(s[0].getAttribute('src')).toMatch(/connect\.facebook\.net\/.*fbevents\.js/);
    expect(s[0].getAttribute('src')).not.toContain(MDM_ID);
    expect(callsOf('init')).toHaveLength(1);
    expect(callsOf('init')[0][1]).toBe(PIXEL_ID);
    expect(JSON.stringify(rec.calls)).not.toContain(MDM_ID);
  });
});

describe('R2 init hygiene', () => {
  it('disablePushState true + set autoConfig false BEFORE init; init gets exactly the id', () => {
    const m = load();
    m.ensurePixel('/today');
    expect(rec.initSnapshots).toHaveLength(1);
    const snap = rec.initSnapshots[0];
    expect(snap.disablePushState).toBe(true);
    expect(snap.autoConfigSeenBefore).toBe(true);
    expect(snap.args).toEqual(['init', PIXEL_ID]);
    const ac = rec.calls.find((c) => c[0] === 'set' && c[1] === 'autoConfig');
    expect(ac).toEqual(['set', 'autoConfig', false, PIXEL_ID]);
  });

  it('no advanced matching: no call anywhere carries email/phone-like data', () => {
    const m = load();
    m.ensurePixel('/today');
    m.trackPixelPageView('/today');
    const s = JSON.stringify(rec.calls);
    expect(s).not.toMatch(/"(em|ph|email|phone|fn|ln)"/);
    expect(s).not.toMatch(/@/);
  });

  it('PageView is never fired before init', () => {
    const m = load();
    m.ensurePixel('/today');
    m.trackPixelPageView('/today');
    const iInit = rec.calls.findIndex((c) => c[0] === 'init');
    const iPv = rec.calls.findIndex((c) => c[0] === 'track' && c[1] === 'PageView');
    expect(iInit).toBeGreaterThanOrEqual(0);
    expect(iPv).toBeGreaterThan(iInit);
  });
});

const DENIED = [
  '/reset-password',
  '/reset-password/',
  '/verify-email',
  '/verify-email/',
  '/privacy-policy',
  '/privacy-policy/',
  '/terms-conditions',
  '/terms-conditions/',
  '/refund-policy',
  '/refund-policy/',
  '/reset-password?x=1',
  '/privacy-policy#section',
  '/today?token=abc',
  '/today?TOKEN=abc',
  '/today?Token=abc',
  '/today?a=1&token=abc',
  '/today?a=1&TOKEN=abc',
  '/today?token=',
  '/today?token',
  '/pricing/?token=abc',
  'https://onlyjobs.example/today?token=abc',
  'https://onlyjobs.example/privacy-policy/',
];

const ELIGIBLE = [
  '/',
  '/today',
  '/pricing',
  '/privacy-policy-extra',
  '/privacy-policy/foo',
  '/blog/reset-password',
  '/today?mytoken=1',
  '/today?tokens=1',
  '/today?view=skipped',
  'https://onlyjobs.example/pricing',
];

describe('R3 denylist', () => {
  it.each(DENIED)('denied URL %s: no init, no script, no fbq at all', (url) => {
    const m = load();
    expect(m.ensurePixel(url)).toBe(false);
    m.trackPixelPageView(url);
    expect(fbeventsScripts()).toHaveLength(0);
    expect(anyPixelScript()).toHaveLength(0);
    expect(rec.current).toBeUndefined();
    expect(rec.calls).toHaveLength(0);
  });

  it.each(ELIGIBLE)('eligible URL %s: inits', (url) => {
    const m = load();
    expect(m.ensurePixel(url)).toBe(true);
    expect(callsOf('init')).toHaveLength(1);
  });

  it('denied URL never emits a PageView even if pixel is already active from a prior page', () => {
    const m = load();
    m.ensurePixel('/today');
    const before = rec.calls.length;
    m.trackPixelPageView('/reset-password');
    m.trackPixelPageView('/today?token=abc');
    expect(rec.calls.length).toBe(before);
    expect(tracks('PageView')).toHaveLength(0);
  });

  it('denied URL after the pixel is active: ensurePixel(denied) must not report active-and-fire, and PageView suppressed', () => {
    const m = load();
    m.ensurePixel('/today');
    m.trackPixelPageView('/today');
    expect(tracks('PageView')).toHaveLength(1);
    m.ensurePixel('/verify-email');
    m.trackPixelPageView('/verify-email');
    expect(tracks('PageView')).toHaveLength(1);
  });

  it('first URL denied, later eligible: init exactly once and one PageView', () => {
    const m = load();
    expect(m.ensurePixel('/reset-password?token=abc')).toBe(false);
    m.trackPixelPageView('/reset-password?token=abc');
    expect(rec.calls).toHaveLength(0);
    expect(m.ensurePixel('/today')).toBe(true);
    m.trackPixelPageView('/today');
    expect(callsOf('init')).toHaveLength(1);
    expect(tracks('PageView')).toHaveLength(1);
    expect(fbeventsScripts()).toHaveLength(1);
  });

  it('init happens at most once across many eligible URLs and repeated calls', () => {
    const m = load();
    for (const u of ['/today', '/pricing', '/today', '/browse', '/']) {
      m.ensurePixel(u);
      m.ensurePixel(u);
    }
    expect(callsOf('init')).toHaveLength(1);
    expect(fbeventsScripts()).toHaveLength(1);
    expect(callsOf('set').filter((c) => c[1] === 'autoConfig')).toHaveLength(1);
  });

  it('events fired while pixel never became active (only denied URLs seen) are no-ops', () => {
    const m = load();
    setUrl('/reset-password?token=abc');
    m.ensurePixel('/reset-password?token=abc');
    m.trackPixelEvent('Purchase', { value: 5, currency: 'USD' }, 'purchase_zzz');
    m.trackPixelCustomEvent('Activated', {}, 'activated_zzz');
    expect(rec.calls).toHaveLength(0);
    expect(fbeventsScripts()).toHaveLength(0);
  });
});

describe('R4 PageView', () => {
  it('trackPixelPageView on eligible URL -> exactly fbq("track","PageView") once per call', () => {
    const m = load();
    m.ensurePixel('/today');
    m.trackPixelPageView('/today');
    expect(tracks('PageView')).toHaveLength(1);
    m.trackPixelPageView('/pricing');
    expect(tracks('PageView')).toHaveLength(2);
  });

  it('trackPixelPageView on an eligible URL initialises lazily or not at all, never double-inits', () => {
    const m = load();
    m.trackPixelPageView('/today');
    m.ensurePixel('/today');
    m.trackPixelPageView('/pricing');
    expect(callsOf('init').length).toBeLessThanOrEqual(1);
  });
});

describe('R5 event ids', () => {
  const active = () => { const m = load(); m.ensurePixel('/today'); return m; };

  it('track: exact args with eventID (capital ID) as 4th arg', () => {
    const m = active();
    m.trackPixelEvent('Purchase', { value: 10, currency: 'USD' }, 'purchase_abc');
    const c = tracks('Purchase');
    expect(c).toHaveLength(1);
    expect(c[0]).toEqual(['track', 'Purchase', { value: 10, currency: 'USD' }, { eventID: 'purchase_abc' }]);
    expect(Object.keys(c[0][3])).toEqual(['eventID']);
  });

  it('trackCustom: uses trackCustom, never track, with eventID 4th arg', () => {
    const m = active();
    m.trackPixelCustomEvent('Activated', {}, 'activated_1');
    expect(rec.calls.filter((c) => c[0] === 'trackCustom')).toEqual([
      ['trackCustom', 'Activated', {}, { eventID: 'activated_1' }],
    ]);
    expect(tracks('Activated')).toHaveLength(0);
  });

  it('same eventID never fires twice (track), repeated calls', () => {
    const m = active();
    for (let i = 0; i < 5; i++) m.trackPixelEvent('Purchase', { value: 10, currency: 'USD' }, 'purchase_dup');
    expect(tracks('Purchase')).toHaveLength(1);
  });

  it('same eventID never fires twice (trackCustom)', () => {
    const m = active();
    for (let i = 0; i < 3; i++) m.trackPixelCustomEvent('Activated', {}, 'act_dup');
    expect(rec.calls.filter((c) => c[0] === 'trackCustom')).toHaveLength(1);
  });

  it('same eventID is suppressed across track and trackCustom', () => {
    const m = active();
    m.trackPixelEvent('CompleteRegistration', {}, 'shared_id');
    m.trackPixelCustomEvent('Activated', {}, 'shared_id');
    expect(rec.calls.filter((c) => c[0] === 'track' || c[0] === 'trackCustom').filter((c) => c[1] !== 'PageView')).toHaveLength(1);
  });

  it('different eventIDs both fire', () => {
    const m = active();
    m.trackPixelEvent('Purchase', { value: 1, currency: 'USD' }, 'p1');
    m.trackPixelEvent('Purchase', { value: 1, currency: 'USD' }, 'p2');
    expect(tracks('Purchase')).toHaveLength(2);
  });

  it('dedupe survives a module reload within the same tab session (session-scoped, e.g. page reload)', () => {
    const m1 = active();
    m1.trackPixelEvent('Purchase', { value: 10, currency: 'USD' }, 'purchase_reload');
    expect(tracks('Purchase')).toHaveLength(1);
    // simulate full reload: new JS context state, same sessionStorage
    delete (window as any).fbq;
    document.querySelectorAll('script[src]').forEach((s) => s.remove());
    rec.restore();
    rec = installFbqRecorder();
    const m2 = load();
    m2.ensurePixel('/today');
    m2.trackPixelEvent('Purchase', { value: 10, currency: 'USD' }, 'purchase_reload');
    expect(tracks('Purchase')).toHaveLength(0);
  });

  it('no eventId: fires without an eventID key (no "undefined" id, no eventId lowercase)', () => {
    const m = active();
    m.trackPixelEvent('ViewContent', { content_name: 'x' });
    const c = tracks('ViewContent');
    expect(c).toHaveLength(1);
    expect(c[0][3]?.eventID).toBeUndefined();
    expect(c[0][3]?.eventId).toBeUndefined();
    expect(JSON.stringify(c[0])).not.toContain('undefined');
  });

  it('never uses lowercase eventId key', () => {
    const m = active();
    m.trackPixelEvent('Purchase', { value: 1, currency: 'USD' }, 'k1');
    m.trackPixelCustomEvent('Activated', {}, 'k2');
    expect(JSON.stringify(rec.calls)).not.toContain('eventId');
  });

  it('sessionStorage.getItem/setItem throwing: no crash', () => {
    const m = active();
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied'); });
    expect(() => m.trackPixelEvent('Purchase', { value: 1, currency: 'USD' }, 'ss_throw')).not.toThrow();
    expect(() => m.trackPixelCustomEvent('Activated', {}, 'ss_throw2')).not.toThrow();
    expect(() => m.trackPixelPageView('/today')).not.toThrow();
  });

  it('sessionStorage property access throwing (SecurityError): no crash', () => {
    const m = active();
    const spy = jest.spyOn(window, 'sessionStorage', 'get').mockImplementation(() => { throw new Error('SecurityError'); });
    expect(() => m.trackPixelEvent('Purchase', { value: 1, currency: 'USD' }, 'ss_prop')).not.toThrow();
    spy.mockRestore();
  });

  it('params object is not mutated and eventID not smuggled into params', () => {
    const m = active();
    const params = { value: 10, currency: 'USD' };
    m.trackPixelEvent('Purchase', params, 'purchase_mut');
    expect(params).toEqual({ value: 10, currency: 'USD' });
    expect(tracks('Purchase')[0][2]).toEqual({ value: 10, currency: 'USD' });
  });
});
