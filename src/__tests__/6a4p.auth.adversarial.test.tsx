/**
 * 6a4p ADVERSARIAL: CompleteRegistration (R6) + click-data transport/leak (R11 auth side).
 * Real AuthContext + real apiClient + real metaPixel + real analytics; fetch and posthog-js mocked.
 */
process.env.NEXT_PUBLIC_API_URL = 'http://api.test.local/api';
process.env.NEXT_PUBLIC_META_PIXEL_ID = '444000111222333';
process.env.NEXT_PUBLIC_POSTHOG_KEY = 'ph-6a4p-key';

import React from 'react';
import { render, act, waitFor, cleanup } from '@testing-library/react';
import { installFbqRecorder, FbqRecorder, setUrl, clearCookies } from './6a4p.helpers';

jest.mock('posthog-js', () => ({
  __esModule: true,
  default: {
    init: jest.fn(), identify: jest.fn(), reset: jest.fn(), capture: jest.fn(),
    setPersonProperties: jest.fn(), setPersonPropertiesOnce: jest.fn(), register: jest.fn(),
    register_once: jest.fn(), people: { set: jest.fn(), set_once: jest.fn() }, get_distinct_id: jest.fn(() => 'd1'),
  },
}));
jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), pathname: '/', query: {}, asPath: '/', events: { on: jest.fn(), off: jest.fn() } }),
}));
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

import posthog from 'posthog-js';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { captureMetaClick } from '@/utils/metaClick';

let rec: FbqRecorder;
let fetchCalls: { url: string; method: string; body: any; raw: any }[] = [];
let authResponse: any;
let authStatus = 200;

const mkResp = (body: any, status = 200) => ({
  ok: status >= 200 && status < 300, status, statusText: String(status),
  headers: { get: () => 'application/json', forEach: () => undefined },
  json: async () => body, text: async () => JSON.stringify(body), clone() { return this; },
});

beforeAll(() => { rec = installFbqRecorder(); });
afterAll(() => rec.restore());
beforeEach(() => {
  rec.calls.length = 0;
  fetchCalls = [];
  authStatus = 200;
  authResponse = { token: 'tok-1', userId: 'u1', id: 'u1', isNewUser: true, metaEventId: 'reg_default' };
  sessionStorage.clear(); localStorage.clear(); clearCookies(); setUrl('/');
  jest.clearAllMocks();
  (global as any).fetch = jest.fn(async (url: any, init: any = {}) => {
    const u = String(url);
    let body: any = undefined;
    try { body = init.body ? JSON.parse(init.body) : undefined; } catch { body = init.body; }
    fetchCalls.push({ url: u, method: (init.method || 'GET').toUpperCase(), body, raw: init.body });
    if (/\/users\/auth(\?|$)/.test(u) && (init.method || 'GET').toUpperCase() === 'POST') return mkResp(authResponse, authStatus);
    return mkResp({});
  });
});
afterEach(() => cleanup());

let authApi: ReturnType<typeof useAuth> | undefined;
const Probe = () => { authApi = useAuth(); return null; };
const mount = async () => {
  const r = render(<AuthProvider><Probe /></AuthProvider>);
  await act(async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); });
  return r;
};
const login = async (email = 'a@b.com', pw = 'password123') => {
  let out: any;
  await act(async () => { try { out = await (authApi as any).authenticate(email, pw); } catch (e) { out = { threw: e }; } });
  await act(async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); });
  return out;
};
const authPost = () => fetchCalls.filter((c) => c.method === 'POST' && /\/users\/auth(\?|$)/.test(c.url));
const completeReg = () => rec.calls.filter((c) => c[0] === 'track' && c[1] === 'CompleteRegistration');
const anyReg = () => rec.calls.filter((c) => /CompleteRegistration/.test(JSON.stringify(c)));
const phCalls = () => {
  const p: any = posthog;
  return JSON.stringify([
    p.capture.mock.calls, p.identify.mock.calls, p.setPersonProperties.mock.calls,
    p.setPersonPropertiesOnce.mock.calls, p.register.mock.calls, p.register_once.mock.calls,
    p.people.set.mock.calls, p.people.set_once.mock.calls,
  ]);
};

describe('R6 CompleteRegistration', () => {
  it('isNewUser:true + metaEventId -> exactly one fbq track CompleteRegistration with eventID', async () => {
    authResponse = { token: 'tok-1', userId: 'u1', id: 'u1', isNewUser: true, metaEventId: 'reg_abc' };
    await mount();
    await login();
    expect(authPost()).toHaveLength(1);
    expect(completeReg()).toHaveLength(1);
    expect(completeReg()[0][3]).toEqual({ eventID: 'reg_abc' });
  });

  it('login (isNewUser:false) even with a metaEventId -> never fires', async () => {
    authResponse = { token: 'tok-1', userId: 'u1', id: 'u1', isNewUser: false, metaEventId: 'reg_login' };
    await mount();
    await login();
    expect(anyReg()).toHaveLength(0);
  });

  it('isNewUser absent -> never fires', async () => {
    authResponse = { token: 'tok-1', userId: 'u1', id: 'u1', metaEventId: 'reg_noflag' };
    await mount();
    await login();
    expect(anyReg()).toHaveLength(0);
  });

  it.each([['"true" string', 'true'], ['1', 1]])('isNewUser truthy-but-not-true (%s) -> does not fire', async (_n, v) => {
    authResponse = { token: 'tok-1', userId: 'u1', id: 'u1', isNewUser: v, metaEventId: 'reg_truthy' };
    await mount();
    await login();
    expect(anyReg()).toHaveLength(0);
  });

  it('isNewUser:true without metaEventId -> does not fire', async () => {
    authResponse = { token: 'tok-1', userId: 'u1', id: 'u1', isNewUser: true };
    await mount();
    await login();
    expect(anyReg()).toHaveLength(0);
  });

  it.each([['empty string', ''], ['null', null]])('isNewUser:true with metaEventId=%s -> does not fire', async (_n, v) => {
    authResponse = { token: 'tok-1', userId: 'u1', id: 'u1', isNewUser: true, metaEventId: v };
    await mount();
    await login();
    expect(anyReg()).toHaveLength(0);
  });

  it('failed auth (HTTP 401) with isNewUser/metaEventId in body -> does not fire', async () => {
    authStatus = 401;
    authResponse = { error: 'bad', isNewUser: true, metaEventId: 'reg_fail' };
    await mount();
    await login();
    expect(anyReg()).toHaveLength(0);
  });

  it('session restore (remount after a new-user signup) does not fire again', async () => {
    authResponse = { token: 'tok-1', userId: 'u1', id: 'u1', isNewUser: true, metaEventId: 'reg_once' };
    const first = await mount();
    await login();
    expect(completeReg()).toHaveLength(1);
    first.unmount();
    rec.calls.length = 0;
    sessionStorage.clear(); // a fresh tab/session: dedupe store cannot be what saves us
    await mount();
    expect(anyReg()).toHaveLength(0);
  });

  it('session restore after a plain login never fires', async () => {
    authResponse = { token: 'tok-1', userId: 'u1', id: 'u1', isNewUser: false, metaEventId: 'reg_x' };
    const first = await mount();
    await login();
    first.unmount();
    sessionStorage.clear();
    await mount();
    expect(anyReg()).toHaveLength(0);
  });

  it('mount with no stored session never fires', async () => {
    await mount();
    expect(rec.calls.filter((c) => c[0] !== 'init' && c[0] !== 'set' && c[1] !== 'PageView')).toHaveLength(0);
  });

  it('same metaEventId on a repeated signup response fires once', async () => {
    authResponse = { token: 'tok-1', userId: 'u1', id: 'u1', isNewUser: true, metaEventId: 'reg_dupe' };
    await mount();
    await login();
    await login();
    expect(completeReg()).toHaveLength(1);
  });

  it('no params object carries PII (email/password) on CompleteRegistration', async () => {
    authResponse = { token: 'tok-1', userId: 'u1', id: 'u1', isNewUser: true, metaEventId: 'reg_pii' };
    await mount();
    await login('secret.person@example.com', 'Sup3rSecret!');
    expect(JSON.stringify(rec.calls)).not.toMatch(/secret\.person|example\.com|Sup3rSecret/);
  });
});

describe('R11 click data transport (auth)', () => {
  it('POST /users/auth body has a top-level metaClick with fbclid/fbc/fbp; not inside attribution', async () => {
    setUrl('/?fbclid=AbC_9.-x');
    captureMetaClick();
    document.cookie = '_fbp=fb.1.1700000000000.123456789; path=/';
    setUrl('/');
    await mount();
    await login();
    const call = authPost()[0];
    expect(call).toBeDefined();
    expect(call.body.metaClick).toBeDefined();
    expect(call.body.metaClick.fbclid).toBe('AbC_9.-x');
    expect(call.body.metaClick.fbc).toMatch(/^fb\.1\.\d+\.AbC_9\.-x$/);
    expect(call.body.metaClick.fbp).toBe('fb.1.1700000000000.123456789');
    const attr = call.body.attribution;
    expect(JSON.stringify(attr ?? {})).not.toMatch(/fbclid|fbc|fbp|AbC_9/);
  });

  it('fbclid/fbc/fbp never appear anywhere in the body except under metaClick', async () => {
    setUrl('/?fbclid=LeakCheck1');
    captureMetaClick();
    setUrl('/');
    await mount();
    await login();
    const body = { ...authPost()[0].body };
    delete body.metaClick;
    expect(JSON.stringify(body)).not.toMatch(/fbclid|fbc|fbp|LeakCheck1/);
  });

  it('no click: request still succeeds and metaClick is absent/empty (not a populated object)', async () => {
    await mount();
    await login();
    const mc = authPost()[0].body.metaClick;
    expect(mc === undefined || mc === null || Object.values(mc).every((v) => v === undefined || v === '')).toBe(true);
  });

  it('click ids never reach PostHog (capture/identify/person props/register)', async () => {
    setUrl('/?fbclid=NoPostHog77');
    captureMetaClick();
    document.cookie = '_fbp=fb.1.1700000000000.55555; path=/';
    setUrl('/');
    await mount();
    await login();
    expect(phCalls()).not.toMatch(/fbclid|fbc|fbp|NoPostHog77|55555/);
  });

  it('click ids never reach PostHog even when landing URL also has utm params (attribution captured)', async () => {
    setUrl('/?utm_source=facebook&utm_campaign=c1&fbclid=WithUtm88');
    captureMetaClick();
    await mount();
    await login();
    expect(phCalls()).not.toMatch(/fbclid|fbc|fbp|WithUtm88/);
    const call = authPost()[0];
    expect(JSON.stringify(call.body.attribution ?? {})).not.toMatch(/fbclid|fbc|fbp|WithUtm88/);
    expect(call.body.metaClick?.fbclid).toBe('WithUtm88');
  });
});
