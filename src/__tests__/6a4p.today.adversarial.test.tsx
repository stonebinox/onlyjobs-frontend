/**
 * 6a4p ADVERSARIAL: /today Activated wiring (R8) + R1 on a page. today.tsx is a black box.
 * Harness patterns copied from lcmc-v2uc.today.adversarial.test.tsx. Real metaPixel is used.
 */
process.env.NEXT_PUBLIC_META_PIXEL_ID = '555000111222333';

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { installFbqRecorder, FbqRecorder, setUrl } from './6a4p.helpers';

let mockView: string | null = null;
const mockApi: Record<string, jest.Mock> = {};

jest.mock('@/lib/apiClient', () => ({
  createApiClient: () =>
    new Proxy({}, { get: (_t, prop: string) => (mockApi[prop] ? mockApi[prop] : async () => ({})) }),
}));
jest.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ isReady: true, isLoggedIn: true }) }));
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => ({ get: (k: string) => (k === 'view' ? mockView : null) }),
}));
jest.mock('next/link', () => {
  const L = ({ href, children, ...rest }: any) => (
    <a href={typeof href === 'string' ? href : href?.pathname} {...rest}>{children}</a>
  );
  return { __esModule: true, default: L };
});
jest.mock('@/components/Layout/DashboardLayout', () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
  DashboardLayout: ({ children }: any) => <div>{children}</div>,
}));
jest.mock('@/components/SEO', () => ({ __esModule: true, default: () => null, SEO: () => null }));
jest.mock('@/components/Dashboard/OutOfCreditPreview', () => ({ __esModule: true, default: () => null, OutOfCreditPreview: () => null }));
jest.mock('@/components/Dashboard/ResumeRequiredBanner', () => ({ __esModule: true, default: () => null, ResumeRequiredBanner: () => null }));
jest.mock('@/components/Dashboard/LocationPromptBanner', () => ({ __esModule: true, default: () => null, LocationPromptBanner: () => null }));
jest.mock('@/components/Dashboard/GenerateAnswer', () => ({ __esModule: true, default: () => null, GenerateAnswer: () => null }));
jest.mock('@/components/Dashboard/JobChatSection', () => ({ __esModule: true, default: () => null, JobChatSection: () => null }));
jest.mock('@/utils/analytics', () => ({ trackEvent: jest.fn(), __esModule: true }));

import TodayPage from '@/pages/today';

const pad = (n: number) => String(n).padStart(2, '0');
const mkJob = (i: string) => ({
  _id: `job-${i}`, title: `Role Title ${i}`, company: `Company Name ${i}`, location: ['Berlin'],
  salary: { min: 100000, max: 120000, currency: 'USD', estimated: false }, tags: [], source: 'src',
  description: 'desc', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  postedDate: '2026-01-01T00:00:00Z', scrapedDate: '2026-01-01T00:00:00Z', url: `https://example.com/jobs/${i}`,
});
const mkMatch = (n: number, over: any = {}) => ({
  _id: `m-${pad(n)}`, userId: 'u1', jobId: `job-${pad(n)}`, matchScore: 100 - n, verdict: 'good',
  reasoning: 'because', clicked: false, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  skipped: false, applied: null, job: mkJob(pad(n)), ...over,
});
const eligible = (c: number) => Array.from({ length: c }, (_, i) => mkMatch(i));
const profile = {
  id: 'u1', name: 'T', email: 't@e.com', phone: null, currentLocation: 'Berlin',
  resume: { skills: ['a'], experience: ['x'], education: [], certifications: [], languages: [], projects: [], achievements: [], volunteerExperience: [], interests: [], summary: 's' },
  preferences: null,
};

type Opts = { matches?: any; visited?: any; skipped?: any; view?: string | null; activation?: any; matchesImpl?: () => Promise<any> };
const setup = (opts: Opts = {}) => {
  mockView = opts.view ?? null;
  Object.keys(mockApi).forEach((k) => delete mockApi[k]);
  const defs: Record<string, any> = {
    getMatches: opts.matchesImpl ?? (async () => opts.matches ?? []),
    getVisited: async () => opts.visited ?? [],
    getSkipped: async () => opts.skipped ?? [],
    checkWalletBalance: async () => ({ balance: 100 }),
    getUserProfile: async () => profile,
    getOutOfCreditPreview: async () => ({ error: 'none' }),
    unskipMatch: async () => ({}),
    markMatchClick: async () => ({}),
    markMatchAsSkipped: async () => ({}),
    markMatchApplied: async () => ({}),
    createOrGetJobConversation: async () => ({ conversationId: 'c1', messages: [] }),
    reportActivation: opts.activation ?? (async () => ({ activated: false })),
  };
  for (const [k, v] of Object.entries(defs)) mockApi[k] = jest.fn(v);
  const ui = () => (<ChakraProvider><TodayPage /></ChakraProvider>);
  const r = render(ui());
  return { ...r, rerenderPage: () => r.rerender(ui()) };
};
const waitForBrief = async () =>
  waitFor(() => expect(screen.queryAllByRole('button', { name: 'Not for me' }).length).toBeGreaterThan(0));
const settle = () => act(async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); });

let rec: FbqRecorder;
const custom = () => rec.calls.filter((c) => c[0] === 'trackCustom');
const trackActivated = () => rec.calls.filter((c) => c[0] === 'track' && c[1] === 'Activated');

beforeAll(() => {
  window.matchMedia = window.matchMedia || (((q: string) => ({ matches: false, media: q, addEventListener: jest.fn(), removeEventListener: jest.fn(), addListener: jest.fn(), removeListener: jest.fn(), onchange: null, dispatchEvent: jest.fn() })) as any);
  (window as any).scrollTo = jest.fn();
  rec = installFbqRecorder(); // persists across tests: pixel init state is module-level
});
beforeEach(() => {
  rec.calls.length = 0;
  window.open = jest.fn(() => null) as any;
  sessionStorage.clear();
  localStorage.clear();
  setUrl('/today');
});
afterAll(() => rec.restore());

describe('R8 Activated', () => {
  it('cards rendered + activated:true -> POST once and fbq trackCustom Activated {} {eventID}; never track', async () => {
    setup({ matches: eligible(2), activation: async () => ({ activated: true, metaEventId: 'act_r8_a' }) });
    await waitForBrief();
    await waitFor(() => expect(mockApi.reportActivation).toHaveBeenCalled());
    await settle();
    expect(mockApi.reportActivation).toHaveBeenCalledTimes(1);
    expect(custom()).toEqual([['trackCustom', 'Activated', {}, { eventID: 'act_r8_a' }]]);
    expect(trackActivated()).toHaveLength(0);
  });

  it('alreadyActivated:true / activated:false -> no fbq Activated', async () => {
    setup({ matches: eligible(2), activation: async () => ({ activated: false, alreadyActivated: true, metaEventId: 'act_r8_b' }) });
    await waitForBrief();
    await waitFor(() => expect(mockApi.reportActivation).toHaveBeenCalled());
    await settle();
    expect(custom()).toHaveLength(0);
    expect(trackActivated()).toHaveLength(0);
  });

  it('activated:false with a metaEventId still present -> no fbq', async () => {
    setup({ matches: eligible(1), activation: async () => ({ activated: false, metaEventId: 'act_r8_c', reason: 'no_cards' }) });
    await waitForBrief();
    await waitFor(() => expect(mockApi.reportActivation).toHaveBeenCalled());
    await settle();
    expect(rec.calls.filter((c) => /Activated/.test(JSON.stringify(c)))).toHaveLength(0);
  });

  it.each([
    ['truthy non-true (1)', 1],
    ['string "true"', 'true'],
  ])('activated is %s (not === true) -> no fbq Activated', async (_n, v) => {
    setup({ matches: eligible(1), activation: async () => ({ activated: v, metaEventId: 'act_r8_strict' }) });
    await waitForBrief();
    await waitFor(() => expect(mockApi.reportActivation).toHaveBeenCalled());
    await settle();
    expect(custom()).toHaveLength(0);
    expect(trackActivated()).toHaveLength(0);
  });

  it('{error} response -> cards stay, nothing fired', async () => {
    setup({ matches: eligible(2), activation: async () => ({ error: 'HTTP 500' }) });
    await waitForBrief();
    await waitFor(() => expect(mockApi.reportActivation).toHaveBeenCalled());
    await settle();
    expect(screen.queryAllByRole('button', { name: 'Not for me' }).length).toBe(2);
    expect(custom()).toHaveLength(0);
  });

  it('rejected promise (network failure) -> cards stay, no unhandled rejection', async () => {
    const unhandled: any[] = [];
    const h = (e: any) => unhandled.push(e);
    process.on('unhandledRejection', h);
    setup({ matches: eligible(2), activation: async () => { throw new Error('network down'); } });
    await waitForBrief();
    await waitFor(() => expect(mockApi.reportActivation).toHaveBeenCalled());
    await settle();
    process.off('unhandledRejection', h);
    expect(screen.queryAllByRole('button', { name: 'Not for me' }).length).toBe(2);
    expect(custom()).toHaveLength(0);
    expect(unhandled).toHaveLength(0);
  });

  it('synchronously throwing reportActivation does not take the page down', async () => {
    setup({ matches: eligible(2), activation: () => { throw new Error('sync boom'); } });
    await waitForBrief();
    await settle();
    expect(screen.queryAllByRole('button', { name: 'Not for me' }).length).toBe(2);
  });

  it('empty brief -> activation never called', async () => {
    setup({ matches: [], activation: async () => ({ activated: true, metaEventId: 'act_r8_empty' }) });
    await settle();
    await new Promise((r) => setTimeout(r, 50));
    await settle();
    expect(mockApi.reportActivation).not.toHaveBeenCalled();
    expect(custom()).toHaveLength(0);
  });

  it('only ineligible matches (skipped/clicked/applied) -> no cards -> activation never called', async () => {
    setup({
      matches: [mkMatch(0, { skipped: true }), mkMatch(1, { clicked: true }), mkMatch(2, { applied: true })],
      activation: async () => ({ activated: true, metaEventId: 'act_r8_inel' }),
    });
    await settle();
    await new Promise((r) => setTimeout(r, 50));
    await settle();
    expect(screen.queryAllByRole('button', { name: 'Not for me' })).toHaveLength(0);
    expect(mockApi.reportActivation).not.toHaveBeenCalled();
  });

  it('not called while the brief is still loading; called after it resolves with cards', async () => {
    let release!: (v: any) => void;
    setup({
      matchesImpl: () => new Promise((res) => { release = res; }),
      activation: async () => ({ activated: true, metaEventId: 'act_r8_load' }),
    });
    await settle();
    await new Promise((r) => setTimeout(r, 50));
    await settle();
    expect(mockApi.reportActivation).not.toHaveBeenCalled();
    await act(async () => { release(eligible(2)); });
    await waitForBrief();
    await waitFor(() => expect(mockApi.reportActivation).toHaveBeenCalled());
  });

  it('getMatches rejects (load failure) -> no activation', async () => {
    setup({ matchesImpl: async () => { throw new Error('boom'); }, activation: async () => ({ activated: true, metaEventId: 'act_r8_lf' }) });
    await settle();
    await new Promise((r) => setTimeout(r, 50));
    await settle();
    expect(mockApi.reportActivation).not.toHaveBeenCalled();
    expect(custom()).toHaveLength(0);
  });

  it.each(['skipped', 'visited'])('?view=%s with cards -> activation never called', async (view) => {
    setup({
      view,
      matches: eligible(2),
      visited: [mkMatch(10, { clicked: true })],
      skipped: [mkMatch(11, { skipped: true })],
      activation: async () => ({ activated: true, metaEventId: `act_r8_v_${view}` }),
    });
    await settle();
    await new Promise((r) => setTimeout(r, 80));
    await settle();
    expect(mockApi.reportActivation).not.toHaveBeenCalled();
    expect(custom()).toHaveLength(0);
  });

  it.each(['skipped', 'visited'])('navigating to ?view=%s after cards rendered adds no further activation call', async (view) => {
    const h = setup({
      matches: eligible(2),
      visited: [mkMatch(10, { clicked: true })],
      skipped: [mkMatch(11, { skipped: true })],
      activation: async () => ({ activated: false, alreadyActivated: true }),
    });
    await waitForBrief();
    await waitFor(() => expect(mockApi.reportActivation).toHaveBeenCalled());
    await settle();
    const before = mockApi.reportActivation.mock.calls.length;
    mockView = view;
    await act(async () => { h.rerenderPage(); });
    await settle();
    await new Promise((r) => setTimeout(r, 50));
    await settle();
    expect(mockApi.reportActivation.mock.calls.length).toBe(before);
  });

  it('re-renders do not re-POST (inferred: at most one activation call per page visit)', async () => {
    const h = setup({ matches: eligible(2), activation: async () => ({ activated: false, alreadyActivated: true }) });
    await waitForBrief();
    await waitFor(() => expect(mockApi.reportActivation).toHaveBeenCalled());
    for (let i = 0; i < 3; i++) { await act(async () => { h.rerenderPage(); }); }
    await settle();
    expect(mockApi.reportActivation.mock.calls.length).toBeLessThanOrEqual(1);
  });

  it('Activated eventID is never fired twice even if the API says activated:true again with same id', async () => {
    const h = setup({ matches: eligible(2), activation: async () => ({ activated: true, metaEventId: 'act_r8_same' }) });
    await waitForBrief();
    await waitFor(() => expect(custom().length).toBeGreaterThan(0));
    for (let i = 0; i < 3; i++) { await act(async () => { h.rerenderPage(); }); }
    await settle();
    expect(custom().filter((c) => c[3]?.eventID === 'act_r8_same')).toHaveLength(1);
  });

  it('activation call is a bare call (no args carrying click ids)', async () => {
    setup({ matches: eligible(1), activation: async () => ({ activated: false }) });
    await waitForBrief();
    await waitFor(() => expect(mockApi.reportActivation).toHaveBeenCalled());
    expect(JSON.stringify(mockApi.reportActivation.mock.calls)).not.toMatch(/fbclid|fbc|fbp/);
  });
});
