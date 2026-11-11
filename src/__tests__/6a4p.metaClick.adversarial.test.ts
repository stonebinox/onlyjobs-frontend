/**
 * 6a4p ADVERSARIAL: metaClick (R10). Black-box through captureMetaClick/getMetaClickPayload.
 * Storage keys are unknown, so assertions scan all of localStorage / document.cookie.
 */
import { clearCookies, setUrl } from './6a4p.helpers';

type Mod = typeof import('../utils/metaClick');
const T0 = Date.UTC(2026, 10, 1, 12, 0, 0);
const DAY = 24 * 60 * 60 * 1000;

function load(): Mod {
  let m!: Mod;
  jest.isolateModules(() => {
    m = require('../utils/metaClick');
  });
  return m;
}
const lsDump = () => {
  const out: string[] = [];
  for (let i = 0; i < localStorage.length; i++) out.push(`${localStorage.key(i)}=${localStorage.getItem(localStorage.key(i)!)}`);
  return out.join('\n');
};

beforeEach(() => {
  jest.useFakeTimers({ now: T0 });
  localStorage.clear();
  sessionStorage.clear();
  clearCookies();
  setUrl('/');
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
  setUrl('/');
  clearCookies();
});

describe('R10 capture + persistence', () => {
  it('valid fbclid: stored in localStorage AND oj_meta_click cookie; payload has fbclid and fb.1.<ms>.<fbclid>', () => {
    const m = load();
    setUrl('/?fbclid=AbC123_-.x');
    m.captureMetaClick();
    expect(lsDump()).toContain('AbC123_-.x');
    expect(document.cookie).toMatch(/(^|;\s*)oj_meta_click=/);
    const p = m.getMetaClickPayload();
    expect(p?.fbclid).toBe('AbC123_-.x');
    expect(p?.fbc).toBe(`fb.1.${T0}.AbC123_-.x`);
  });

  it('survives a fresh page load with no query string (module reloaded, URL cleaned)', () => {
    load();
    setUrl('/?fbclid=keepme1');
    load().captureMetaClick();
    setUrl('/today');
    const p = load().getMetaClickPayload();
    expect(p?.fbclid).toBe('keepme1');
    expect(p?.fbc).toBe(`fb.1.${T0}.keepme1`);
  });

  it('survives when only the cookie remains (localStorage wiped)', () => {
    setUrl('/?fbclid=cookieonly');
    load().captureMetaClick();
    localStorage.clear();
    setUrl('/');
    expect(load().getMetaClickPayload()?.fbclid).toBe('cookieonly');
  });

  it('survives when only localStorage remains (cookie wiped)', () => {
    setUrl('/?fbclid=lsonly');
    load().captureMetaClick();
    clearCookies();
    setUrl('/');
    expect(load().getMetaClickPayload()?.fbclid).toBe('lsonly');
  });

  it('no click ever captured: payload undefined', () => {
    expect(load().getMetaClickPayload()).toBeUndefined();
  });

  it('capture with no fbclid in URL and nothing stored: stores nothing', () => {
    setUrl('/today?utm_source=x');
    load().captureMetaClick();
    expect(lsDump()).toBe('');
    expect(document.cookie).not.toContain('oj_meta_click');
    expect(load().getMetaClickPayload()).toBeUndefined();
  });

  it('fbc timestamp is fixed at capture time (does not change on later reads)', () => {
    const m = load();
    setUrl('/?fbclid=stable1');
    m.captureMetaClick();
    const first = m.getMetaClickPayload()?.fbc;
    jest.setSystemTime(T0 + 3 * DAY);
    const later = load().getMetaClickPayload()?.fbc;
    expect(first).toBe(`fb.1.${T0}.stable1`);
    expect(later).toBe(first);
  });

  it('calling capture repeatedly on same URL is idempotent (timestamp not refreshed)', () => {
    const m = load();
    setUrl('/?fbclid=idem1');
    m.captureMetaClick();
    jest.setSystemTime(T0 + 1000);
    m.captureMetaClick();
    expect(m.getMetaClickPayload()?.fbc).toBe(`fb.1.${T0}.idem1`);
  });

  it('first non-expired click kept: 2nd fbclid at 7d-1ms does not overwrite', () => {
    const m = load();
    setUrl('/?fbclid=first1');
    m.captureMetaClick();
    jest.setSystemTime(T0 + 7 * DAY - 1);
    setUrl('/?fbclid=second2');
    m.captureMetaClick();
    const p = load().getMetaClickPayload();
    expect(p?.fbclid).toBe('first1');
    expect(p?.fbc).toBe(`fb.1.${T0}.first1`);
    expect(lsDump()).not.toContain('second2');
  });

  it('a second fbclid shortly after (1 min) does not overwrite', () => {
    const m = load();
    setUrl('/?fbclid=first1');
    m.captureMetaClick();
    jest.setSystemTime(T0 + 60_000);
    setUrl('/?fbclid=second2');
    m.captureMetaClick();
    expect(load().getMetaClickPayload()?.fbclid).toBe('first1');
  });

  it('after 7d+1ms a new fbclid replaces the old one (fbc re-timestamped)', () => {
    const m = load();
    setUrl('/?fbclid=first1');
    m.captureMetaClick();
    const t1 = T0 + 7 * DAY + 1;
    jest.setSystemTime(t1);
    setUrl('/?fbclid=second2');
    m.captureMetaClick();
    const p = load().getMetaClickPayload();
    expect(p?.fbclid).toBe('second2');
    expect(p?.fbc).toBe(`fb.1.${t1}.second2`);
  });

  it('after 7d+1ms with no new fbclid the expired click is not returned', () => {
    setUrl('/?fbclid=old1');
    load().captureMetaClick();
    jest.setSystemTime(T0 + 7 * DAY + 1);
    setUrl('/today');
    const p = load().getMetaClickPayload();
    expect(p?.fbclid).toBeUndefined();
    expect(p?.fbc).toBeUndefined();
  });

  it('just before expiry (7d-1ms) the click is still returned', () => {
    setUrl('/?fbclid=live1');
    load().captureMetaClick();
    jest.setSystemTime(T0 + 7 * DAY - 1);
    setUrl('/today');
    expect(load().getMetaClickPayload()?.fbclid).toBe('live1');
  });

  it('cookie is written with a ~7 day lifetime (max-age or expires between 6 and 8 days)', () => {
    const desc = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie')!;
    const writes: string[] = [];
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get() { return desc.get!.call(document); },
      set(v: string) { writes.push(v); desc.set!.call(document, v); },
    });
    try {
      setUrl('/?fbclid=cexp1');
      load().captureMetaClick();
    } finally {
      delete (document as any).cookie;
    }
    const w = writes.find((x) => x.startsWith('oj_meta_click='));
    expect(w).toBeDefined();
    const maxAge = /max-age=(\d+)/i.exec(w!);
    const expires = /expires=([^;]+)/i.exec(w!);
    const lifetimeMs = maxAge ? Number(maxAge[1]) * 1000 : expires ? Date.parse(expires[1]) - T0 : NaN;
    expect(lifetimeMs).toBeGreaterThanOrEqual(6 * DAY);
    expect(lifetimeMs).toBeLessThanOrEqual(8 * DAY);
  });
});

describe('R10 validation', () => {
  const bad: [string, string][] = [
    ['space (%20)', 'ab%20cd'],
    ['plus (decodes to space)', 'ab+cd'],
    ['dollar', 'ab$cd'],
    ['slash', 'ab%2Fcd'],
    ['semicolon (cookie injection)', 'ab%3Bpath%3D%2F'],
    ['equals', 'ab%3Dcd'],
    ['comma', 'ab%2Ccd'],
    ['unicode', 'ab%C3%A9cd'],
    ['angle bracket', '%3Cscript%3E'],
    ['newline', 'ab%0Acd'],
    ['513 chars', 'a'.repeat(513)],
    ['1000 chars', 'a'.repeat(1000)],
    ['empty', ''],
  ];
  it.each(bad)('rejects invalid fbclid: %s', (_n, v) => {
    setUrl(`/?fbclid=${v}`);
    load().captureMetaClick();
    expect(lsDump()).toBe('');
    expect(document.cookie).not.toContain('oj_meta_click');
    expect(load().getMetaClickPayload()).toBeUndefined();
  });

  it.each([400, 491, 500, 511, 512])('accepts and returns a %i char fbclid (boundary: only > 512 is invalid)', (n) => {
    const v = 'a'.repeat(n);
    setUrl(`/?fbclid=${v}`);
    load().captureMetaClick();
    expect(load().getMetaClickPayload()?.fbclid).toBe(v);
  });

  it('accepts the full allowed alphabet', () => {
    const v = 'ABCxyz0189._-';
    setUrl(`/?fbclid=${v}`);
    load().captureMetaClick();
    expect(load().getMetaClickPayload()?.fbclid).toBe(v);
  });

  it('an invalid fbclid does not displace/destroy an existing valid stored click', () => {
    setUrl('/?fbclid=good1');
    load().captureMetaClick();
    setUrl('/?fbclid=ba%20d');
    load().captureMetaClick();
    expect(load().getMetaClickPayload()?.fbclid).toBe('good1');
  });

  it('an invalid fbclid does not block a later valid one', () => {
    setUrl('/?fbclid=ba%20d');
    load().captureMetaClick();
    setUrl('/?fbclid=good2');
    load().captureMetaClick();
    expect(load().getMetaClickPayload()?.fbclid).toBe('good2');
  });

  it('fbclid among other params is found', () => {
    setUrl('/today?utm_source=fb&fbclid=amid1&x=2');
    load().captureMetaClick();
    expect(load().getMetaClickPayload()?.fbclid).toBe('amid1');
  });

  it('param named like fbclid but different (xfbclid, FBCLID) is not captured as fbclid', () => {
    setUrl('/?xfbclid=nope1&myfbclid=nope2');
    load().captureMetaClick();
    expect(load().getMetaClickPayload()).toBeUndefined();
  });
});

describe('R10 cookies _fbc/_fbp', () => {
  it('_fbc cookie wins over stored constructed fbc', () => {
    setUrl('/?fbclid=store1');
    load().captureMetaClick();
    document.cookie = '_fbc=fb.1.111.cookieval; path=/';
    expect(load().getMetaClickPayload()?.fbc).toBe('fb.1.111.cookieval');
  });

  it('_fbc cookie with no stored click is returned as fbc', () => {
    document.cookie = '_fbc=fb.1.222.onlycookie; path=/';
    expect(load().getMetaClickPayload()?.fbc).toBe('fb.1.222.onlycookie');
  });

  it('_fbp cookie is returned as fbp', () => {
    document.cookie = '_fbp=fb.1.333.987654321; path=/';
    expect(load().getMetaClickPayload()?.fbp).toBe('fb.1.333.987654321');
  });

  it('_fbp is returned together with a stored click', () => {
    setUrl('/?fbclid=both1');
    load().captureMetaClick();
    document.cookie = '_fbp=fb.1.444.5555; path=/';
    const p = load().getMetaClickPayload();
    expect(p?.fbp).toBe('fb.1.444.5555');
    expect(p?.fbclid).toBe('both1');
  });

  it('cookie parsing: similarly named cookies (xx_fbc, _fbcx) are not confused with _fbc/_fbp', () => {
    document.cookie = 'xx_fbc=fb.1.1.wrong; path=/';
    document.cookie = '_fbcx=fb.1.1.wrong2; path=/';
    document.cookie = 'my_fbp=fb.1.1.wrong3; path=/';
    const p = load().getMetaClickPayload();
    expect(p?.fbc).toBeUndefined();
    expect(p?.fbp).toBeUndefined();
  });
});

describe('R10 storage failures', () => {
  it('localStorage.setItem/getItem throwing: capture and read do not throw', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
    setUrl('/?fbclid=throws1');
    const m = load();
    expect(() => m.captureMetaClick()).not.toThrow();
    expect(() => m.getMetaClickPayload()).not.toThrow();
  });

  it('localStorage property access throwing (SecurityError): no crash', () => {
    jest.spyOn(window, 'localStorage', 'get').mockImplementation(() => { throw new Error('SecurityError'); });
    setUrl('/?fbclid=throws2');
    const m = load();
    expect(() => m.captureMetaClick()).not.toThrow();
    expect(() => m.getMetaClickPayload()).not.toThrow();
  });

  it('localStorage throwing (inferred): the cookie copy still carries the click', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
    setUrl('/?fbclid=throws3');
    const m = load();
    m.captureMetaClick();
    expect(document.cookie).toContain('oj_meta_click');
    expect(m.getMetaClickPayload()?.fbclid).toBe('throws3');
  });

  it('corrupted stored values (garbage in localStorage and cookie) do not crash reads', () => {
    setUrl('/?fbclid=corrupt1');
    load().captureMetaClick();
    for (let i = 0; i < localStorage.length; i++) localStorage.setItem(localStorage.key(i)!, 'not json{{{');
    document.cookie = 'oj_meta_click=%E0%A4%A; path=/';
    setUrl('/');
    const m = load();
    expect(() => m.getMetaClickPayload()).not.toThrow();
  });

  it('after corruption a fresh valid fbclid is captured (corrupt != existing click)', () => {
    setUrl('/?fbclid=corrupt1');
    load().captureMetaClick();
    for (let i = 0; i < localStorage.length; i++) localStorage.setItem(localStorage.key(i)!, 'not json{{{');
    document.cookie = 'oj_meta_click=garbage; path=/';
    setUrl('/?fbclid=fresh9');
    const m = load();
    m.captureMetaClick();
    expect(m.getMetaClickPayload()?.fbclid).toBe('fresh9');
  });
});
