/**
 * Smoke tests for the wallet beacon functions (onlyjobs-9rm).
 * Exercises the REAL createApiClient().recordFailureAttempt() with
 * global.fetch mocked at the authFetch seam.
 *
 * Oracle: the backend contracts from the task spec:
 *   POST /wallet/record-failure-attempt    body: { orderId, errorCode, errorDescription, errorReason }
 *
 * cancelOrder and recordPaymentFailure are no longer called from the client
 * (removed in correctness pass per the principle that the client must never
 * write a terminal status to a wallet transaction).
 */

process.env.NEXT_PUBLIC_API_URL = 'http://api.test.local';

import { createApiClient } from '@/lib/apiClient';

function makeFetchResponse(status: number, body: unknown) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  };
}

describe('recordFailureAttempt — real wrapper, fetch mocked at authFetch seam', () => {
  let api: ReturnType<typeof createApiClient>;

  beforeEach(() => {
    api = createApiClient();
    localStorage.clear();
    localStorage.setItem('onlyjobs_token', 'test-token-9rm');
    (global as any).fetch = jest.fn();
  });

  afterEach(() => {
    delete (global as any).fetch;
  });

  it('POSTs to /wallet/record-failure-attempt with orderId and error fields spread into body', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      makeFetchResponse(200, { success: true })
    );

    await api.recordFailureAttempt('order_abc123', {
      errorCode: 'BAD_REQUEST_ERROR',
      errorDescription: 'Card declined',
      errorReason: 'payment_failed',
    });

    expect(global.fetch as jest.Mock).toHaveBeenCalledTimes(1);
    const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('http://api.test.local/wallet/record-failure-attempt');
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body)).toEqual({
      orderId: 'order_abc123',
      errorCode: 'BAD_REQUEST_ERROR',
      errorDescription: 'Card declined',
      errorReason: 'payment_failed',
    });
  });

  it('returns { error } and does not throw on non-ok response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      makeFetchResponse(404, { message: 'Pending transaction not found' })
    );

    const result = await api.recordFailureAttempt('order_missing', {
      errorCode: 'X',
    });

    expect(result).toHaveProperty('error');
  });

  it('passes keepalive:true so the request survives tab close / modal dismiss', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      makeFetchResponse(200, { success: true })
    );

    await api.recordFailureAttempt('order_keepalive', { errorCode: 'Z' });

    const [, opts] = (global.fetch as jest.Mock).mock.calls[0];
    expect(opts.keepalive).toBe(true);
  });
});
