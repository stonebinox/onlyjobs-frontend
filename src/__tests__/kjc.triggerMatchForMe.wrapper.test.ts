/**
 * Gap 1 — triggerMatchForMe real wrapper test (onlyjobs-kjc pass 2)
 *
 * Exercises the REAL createApiClient().triggerMatchForMe() with global.fetch
 * mocked at the seam (authFetch → fetch).  No mock of @/lib/apiClient — the
 * real response-mapping code runs so any field-drop bug surfaces here.
 *
 * Regression guard: the 400 insufficient_balance case MUST preserve
 * walletBalance AND required — the field-drop bug that motivated this test.
 *
 * Oracle: the backend contract documented in the bd task onlyjobs-kjc.
 */

process.env.NEXT_PUBLIC_API_URL = 'http://api.test.local';

import { createApiClient } from '@/lib/apiClient';

// Build a minimal fetch-Response-compatible object
function makeFetchResponse(status: number, body: unknown) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  };
}

describe('triggerMatchForMe — real wrapper, fetch mocked at the authFetch seam', () => {
  let api: ReturnType<typeof createApiClient>;

  beforeEach(() => {
    api = createApiClient();
    // authFetch reads the token from localStorage
    localStorage.clear();
    localStorage.setItem('onlyjobs_token', 'test-token-kjc');
    // global.fetch is not defined in this jsdom version — define it for each test
    (global as any).fetch = jest.fn();
  });

  afterEach(() => {
    delete (global as any).fetch;
  });

  // ── 202 success ─────────────────────────────────────────────────────────────

  it('202 { message } → { ok:true, status:202, message }', async () => {
    const body = { message: 'Match triggered successfully' };
    (global.fetch as jest.Mock).mockResolvedValueOnce(makeFetchResponse(202, body));

    const result = await api.triggerMatchForMe();

    expect(result.ok).toBe(true);
    expect(result.status).toBe(202);
    expect(result.message).toBe(body.message);
  });

  // ── 400 insufficient_balance — REGRESSION GUARD ───────────────────────────

  it(
    '400 insufficient_balance → { ok:false, status:400, reason, walletBalance, required, message }' +
    ' — walletBalance AND required must be preserved',
    async () => {
      const body = {
        reason: 'insufficient_balance',
        walletBalance: 0.1,
        required: 0.3,
        message: 'Insufficient wallet balance',
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce(makeFetchResponse(400, body));

      const result = await api.triggerMatchForMe();

      expect(result.ok).toBe(false);
      expect(result.status).toBe(400);
      expect(result.reason).toBe('insufficient_balance');
      // Regression guard: both fields must survive the mapping intact.
      // FINDING if either fails: the wrapper drops the field and the UI
      // cannot show the user how much they need to top up.
      expect(result.walletBalance).toBe(0.1);
      expect(result.required).toBe(0.3);
      expect(result.message).toBe(body.message);
    }
  );

  // ── 403 unverified ───────────────────────────────────────────────────────

  it('403 { reason:"unverified", message } → { ok:false, status:403, reason:"unverified" }', async () => {
    const body = { reason: 'unverified', message: 'Please verify your email' };
    (global.fetch as jest.Mock).mockResolvedValueOnce(makeFetchResponse(403, body));

    const result = await api.triggerMatchForMe();

    expect(result.ok).toBe(false);
    expect(result.status).toBe(403);
    expect(result.reason).toBe('unverified');
  });

  // ── 429 rate-limit ───────────────────────────────────────────────────────

  it('429 { retryAfterMinutes:42, message } → { ok:false, status:429, retryAfterMinutes:42 }', async () => {
    const body = { retryAfterMinutes: 42, message: 'Too many requests' };
    (global.fetch as jest.Mock).mockResolvedValueOnce(makeFetchResponse(429, body));

    const result = await api.triggerMatchForMe();

    expect(result.ok).toBe(false);
    expect(result.status).toBe(429);
    expect(result.retryAfterMinutes).toBe(42);
  });

  // ── 502 server error ─────────────────────────────────────────────────────

  it('502 non-ok { message } → { ok:false, status:502 }', async () => {
    const body = { message: 'Bad Gateway' };
    (global.fetch as jest.Mock).mockResolvedValueOnce(makeFetchResponse(502, body));

    const result = await api.triggerMatchForMe();

    expect(result.ok).toBe(false);
    expect(result.status).toBe(502);
  });

  // ── fetch rejects (network down) ─────────────────────────────────────────

  it('fetch rejects → { ok:false, status:0, error } (network-down / service-unavailable path)', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));

    const result = await api.triggerMatchForMe();

    expect(result.ok).toBe(false);
    expect(result.status).toBe(0);
    expect(result.error).toBeTruthy();
  });

  // ── non-JSON body ────────────────────────────────────────────────────────

  it('non-JSON body → { ok:false, status:0, error } (service-unavailable path)', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => { throw new SyntaxError('Unexpected token <'); },
    });

    const result = await api.triggerMatchForMe();

    expect(result.ok).toBe(false);
    expect(result.status).toBe(0);
    expect(result.error).toBeTruthy();
  });
});
