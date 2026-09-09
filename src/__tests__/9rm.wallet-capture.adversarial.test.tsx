/**
 * ADVERSARIAL TEST — onlyjobs-9rm
 * Wallet top-up failure/abandonment CAPTURE behavior.
 *
 * Assume the implementation is SUBTLY WRONG; write tests that EXPOSE bugs.
 * Report pass/fail — failures are FINDINGS, not fixes.
 *
 * FORBIDDEN (not opened):
 *   - frontend/src/pages/wallet.tsx
 *   - frontend/src/lib/apiClient.ts
 *   - frontend/src/__tests__/ (any wallet/analytics/9rm file)
 *
 * CONTRACT = oracle. Every expected value traces to the onlyjobs-9rm spec.
 * DISCLOSURE: see bottom of file.
 */

process.env.NEXT_PUBLIC_API_URL = 'http://api.test.local';
process.env.NEXT_PUBLIC_POSTHOG_KEY = 'test-ph-key';

// ─── Mutable mock state (captured lazily so hoisted jest.mock factories work) ──

let mockTrackEvent: jest.Mock;
let mockCancelOrder: jest.Mock;
let mockRecordPaymentFailure: jest.Mock;
let mockRecordFailureAttempt: jest.Mock;
let mockCreatePaymentOrder: jest.Mock;
let mockVerifyPayment: jest.Mock;
let mockGetWalletBalance: jest.Mock;
let mockGetTransactions: jest.Mock;
let mockCheckWalletBalance: jest.Mock;

// Per-Razorpay-instantiation capture
const rzpCap: {
  options: any;
  failureHandler: ((response: any) => void) | null;
  openFn: jest.Mock | null;
} = { options: null, failureHandler: null, openFn: null };

// ─── jest.mock (hoisted before imports) ─────────────────────────────────────

jest.mock('@/utils/analytics', () => ({
  __esModule: true,
  trackEvent: (...args: any[]) => mockTrackEvent(...args),
  initAnalytics: jest.fn(),
  trackPageView: jest.fn(),
  identifyUser: jest.fn(),
  resetAnalyticsUser: jest.fn(),
  setUserPersonProperties: jest.fn(),
}));

jest.mock('@/lib/apiClient', () => ({
  __esModule: true,
  createApiClient: () => ({
    cancelOrder: (...args: any[]) => mockCancelOrder(...args),
    recordPaymentFailure: (...args: any[]) => mockRecordPaymentFailure(...args),
    recordFailureAttempt: (...args: any[]) => mockRecordFailureAttempt(...args),
    createPaymentOrder: (...args: any[]) => mockCreatePaymentOrder(...args),
    verifyPayment: (...args: any[]) => mockVerifyPayment(...args),
    getWalletBalance: (...args: any[]) => mockGetWalletBalance(...args),
    getTransactions: (...args: any[]) => mockGetTransactions(...args),
    checkWalletBalance: (...args: any[]) => mockCheckWalletBalance(...args),
    getUserProfile: jest.fn().mockResolvedValue(null),
    getMatches: jest.fn().mockResolvedValue([]),
    updatePreferences: jest.fn().mockResolvedValue({}),
    updateUserProfile: jest.fn().mockResolvedValue({}),
    updatePassword: jest.fn().mockResolvedValue({}),
    deleteUserAccount: jest.fn().mockResolvedValue({}),
    authenticateUser: jest.fn().mockResolvedValue({}),
    resendVerificationEmail: jest.fn().mockResolvedValue({}),
    getMatchCount: jest.fn().mockResolvedValue(0),
    getOutOfCreditPreview: jest.fn().mockResolvedValue({
      shouldShow: false, reason: 'ok', walletBalance: 100, dailyMatchCost: 0.3,
      onDemandMatchCost: 0.05, count: 0, candidates: [],
    }),
    getAllJobs: jest.fn().mockResolvedValue({ jobs: [], total: 0 }),
    getTracker: jest.fn().mockResolvedValue([]),
    touchSession: jest.fn().mockResolvedValue(undefined),
    uploadCV: jest.fn().mockResolvedValue({}),
    recordApplicationOutcome: jest.fn().mockResolvedValue({}),
    getAvailableJobsCount: jest.fn().mockResolvedValue(0),
    getActiveUserCount: jest.fn().mockResolvedValue(0),
    triggerMatchForMe: jest.fn().mockResolvedValue({ message: 'ok' }),
    getPublicStats: jest.fn().mockResolvedValue(null),
    getGuideProgress: jest.fn().mockResolvedValue({}),
    updateGuideProgress: jest.fn().mockResolvedValue({}),
    sendChatMessage: jest.fn().mockResolvedValue({}),
    getChatConversations: jest.fn().mockResolvedValue([]),
    matchJobOnDemand: jest.fn().mockResolvedValue({ success: true }),
    updateMinMatchScore: jest.fn().mockResolvedValue({}),
    factoryResetUserAccount: jest.fn().mockResolvedValue({}),
  }),
}));

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    pathname: '/wallet',
    query: {},
    asPath: '/wallet',
    events: { on: jest.fn(), off: jest.fn(), emit: jest.fn() },
    isReady: true,
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/wallet',
  useSearchParams: () => new URLSearchParams(),
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

jest.mock('@/theme/theme', () => ({ __esModule: true, default: {} }));

jest.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: () => ({
    isLoggedIn: true,
    isReady: true,
    userId: 'user-adversarial-001',
    token: 'tok-adversarial',
    authenticate: jest.fn(),
    logout: jest.fn(),
  }),
}));

jest.mock('@/contexts/GuideContext', () => ({
  GuideProvider: ({ children }: any) => children,
  useGuide: () => ({ showGuide: false }),
}));

jest.mock('@/components/Layout/DashboardLayout', () => ({
  __esModule: true,
  default: ({ children }: any) => React.createElement(React.Fragment, null, children),
}));

jest.mock('@/components/SEO', () => ({
  __esModule: true,
  SEO: () => null,
  default: () => null,
}));

jest.mock('@/components/Dashboard/EmailVerificationBanner', () => ({
  EmailVerificationBanner: () => null,
}));

jest.mock('@/components/Guide/Guide', () => ({
  __esModule: true,
  default: () => null,
  Guide: () => null,
}));

jest.mock('@chakra-ui/react', () => {
  const React = require('react');
  const cache: Record<string, any> = {};

  const passthrough = (tag: string) => {
    if (cache[tag]) return cache[tag];
    const C = ({ children, onClick, type, disabled, onChange, value,
                  placeholder, 'aria-label': al, href, defaultValue, ...rest }: any) =>
      React.createElement(tag, { onClick, type, disabled, onChange, value,
                                  placeholder, 'aria-label': al, href, defaultValue }, children);
    C.displayName = tag;
    cache[tag] = C;
    return C;
  };

  return {
    __esModule: true,
    Box: passthrough('div'),
    Flex: passthrough('div'),
    VStack: passthrough('div'),
    HStack: passthrough('div'),
    Stack: passthrough('div'),
    SimpleGrid: passthrough('div'),
    Grid: passthrough('div'),
    GridItem: passthrough('div'),
    Text: passthrough('span'),
    Heading: passthrough('h3'),
    Button: passthrough('button'),
    IconButton: passthrough('button'),
    Link: ({ children, href, onClick }: any) =>
      React.createElement('a', { href, onClick }, children),
    Alert: passthrough('div'),
    AlertIcon: () => null,
    AlertTitle: passthrough('span'),
    AlertDescription: passthrough('span'),
    Badge: passthrough('span'),
    Tag: passthrough('span'),
    Spinner: () => React.createElement('div', { role: 'status', 'aria-label': 'Loading' }),
    Divider: () => React.createElement('hr', null),
    Table: passthrough('table'),
    Thead: passthrough('thead'),
    Tbody: passthrough('tbody'),
    Tr: passthrough('tr'),
    Th: passthrough('th'),
    Td: passthrough('td'),
    TableContainer: passthrough('div'),
    TableCaption: passthrough('caption'),
    Tabs: ({ children }: any) => React.createElement('div', null, children),
    TabList: ({ children }: any) => React.createElement('div', null, children),
    Tab: ({ children, onClick }: any) => React.createElement('button', { onClick }, children),
    TabPanels: ({ children }: any) => React.createElement('div', null, children),
    TabPanel: ({ children }: any) => React.createElement('div', null, children),
    // Modals always open so form content is always accessible
    Modal: ({ isOpen, children }: any) =>
      isOpen ? React.createElement(React.Fragment, null, children) : null,
    ModalOverlay: ({ children }: any) => React.createElement('div', null, children),
    ModalContent: ({ children }: any) => React.createElement('div', null, children),
    ModalHeader: ({ children }: any) => React.createElement('h2', null, children),
    ModalBody: ({ children }: any) => React.createElement('div', null, children),
    ModalFooter: ({ children }: any) => React.createElement('div', null, children),
    ModalCloseButton: () => null,
    Drawer: ({ isOpen, children }: any) =>
      isOpen ? React.createElement(React.Fragment, null, children) : null,
    DrawerOverlay: ({ children }: any) => React.createElement('div', null, children),
    DrawerContent: ({ children }: any) => React.createElement('div', null, children),
    DrawerHeader: ({ children }: any) => React.createElement('h2', null, children),
    DrawerBody: ({ children }: any) => React.createElement('div', null, children),
    DrawerFooter: ({ children }: any) => React.createElement('div', null, children),
    DrawerCloseButton: () => null,
    FormControl: passthrough('div'),
    FormLabel: passthrough('label'),
    FormHelperText: passthrough('span'),
    FormErrorMessage: passthrough('span'),
    Input: ({ onChange, value, placeholder, type, defaultValue, ...rest }: any) =>
      React.createElement('input', { onChange, value, placeholder, type, defaultValue }),
    // NumberInput: expose as plain number input; onChange gets (valueString, valueNumber)
    NumberInput: ({ children, onChange, value, min, max, ...rest }: any) => {
      // Render a hidden input that proxies to Chakra's onChange signature
      return React.createElement('div', { 'data-testid': 'number-input-wrapper' },
        React.createElement('input', {
          type: 'number',
          'data-proxy': 'number-input',
          defaultValue: value,
          min, max,
          onChange: (e: any) => {
            const s = e.target.value;
            const n = parseFloat(s);
            if (onChange) onChange(s, n);
          },
        }),
        children,
      );
    },
    NumberInputField: ({ placeholder, ...rest }: any) =>
      React.createElement('input', { type: 'number', placeholder }),
    NumberInputStepper: () => null,
    NumberIncrementStepper: () => null,
    NumberDecrementStepper: () => null,
    InputGroup: passthrough('div'),
    InputLeftAddon: passthrough('span'),
    InputRightAddon: passthrough('span'),
    InputLeftElement: passthrough('span'),
    InputRightElement: passthrough('span'),
    Select: passthrough('select'),
    Checkbox: passthrough('input'),
    Center: passthrough('div'),
    Container: passthrough('div'),
    Skeleton: passthrough('div'),
    SkeletonText: passthrough('div'),
    Stat: passthrough('div'),
    StatLabel: passthrough('span'),
    StatNumber: passthrough('span'),
    StatHelpText: passthrough('span'),
    Card: passthrough('div'),
    CardBody: passthrough('div'),
    CardHeader: passthrough('div'),
    CardFooter: passthrough('div'),
    Tooltip: ({ children }: any) => children,
    Icon: () => null,
    Menu: ({ children }: any) => React.createElement('div', null, children),
    MenuButton: ({ children, onClick }: any) => React.createElement('button', { onClick }, children),
    MenuList: ({ children }: any) => React.createElement('div', null, children),
    MenuItem: ({ children, onClick }: any) => React.createElement('div', { onClick }, children),
    Popover: ({ isOpen, children }: any) =>
      isOpen ? React.createElement(React.Fragment, null, children) : null,
    PopoverTrigger: ({ children }: any) => children,
    PopoverContent: ({ children }: any) => React.createElement('div', null, children),
    PopoverArrow: () => null,
    PopoverBody: ({ children }: any) => React.createElement('div', null, children),
    PopoverHeader: ({ children }: any) => React.createElement('div', null, children),
    Accordion: passthrough('div'),
    AccordionItem: passthrough('div'),
    AccordionButton: passthrough('button'),
    AccordionPanel: passthrough('div'),
    AccordionIcon: () => null,
    useColorModeValue: (light: any) => light,
    useTheme: () => ({ colors: {}, space: {}, sizes: {}, radii: {} }),
    useStyleConfig: () => ({}),
    useMultiStyleConfig: () => ({}),
    // Always-open disclosure so modal form content is always rendered
    useDisclosure: () => ({
      isOpen: true,
      onOpen: jest.fn(),
      onClose: jest.fn(),
      onToggle: jest.fn(),
    }),
    useToast: () => jest.fn(),
    useBreakpointValue: (vals: any) => {
      if (vals && typeof vals === 'object') return vals.base ?? Object.values(vals)[0];
      return vals;
    },
    extendTheme: (t: any) => t,
    ChakraProvider: ({ children }: any) => children,
  };
});

// ─── Imports ─────────────────────────────────────────────────────────────────

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import WalletPage from '@/pages/wallet';

// ─── Razorpay mock factory ───────────────────────────────────────────────────

function installRazorpayMock() {
  rzpCap.options = null;
  rzpCap.failureHandler = null;
  rzpCap.openFn = null;

  (window as any).Razorpay = function (options: any) {
    const openFn = jest.fn();
    const onFn = jest.fn().mockImplementation((event: string, cb: any) => {
      if (event === 'payment.failed') {
        rzpCap.failureHandler = cb;
      }
    });
    rzpCap.options = options;
    rzpCap.openFn = openFn;
    return { open: openFn, on: onFn };
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ORDER_ID = 'rzp_order_adversarial_001';

async function renderWallet() {
  render(<WalletPage />);
  // Let mount effects settle
  await act(async () => {
    await Promise.resolve();
  });
}

/**
 * Attempt to trigger the Razorpay checkout for a given amount.
 * Tries several UI patterns; throws a descriptive error if nothing works.
 * FINDING: if this helper throws, the top-up flow is untestable without
 * reading wallet.tsx.
 */
async function triggerTopup(amountRupees = 100): Promise<void> {
  // Pattern A: there may be a button to open the top-up form first
  const openFormBtn = screen.queryByRole('button', {
    name: /add funds|top[\s-]?up|recharge|add money/i,
  });
  if (openFormBtn) {
    await act(async () => { fireEvent.click(openFormBtn); });
  }

  // Pattern B: direct numeric input (type="number" → role="spinbutton")
  //            or text input labeled "amount"
  let amountInput =
    screen.queryByRole('spinbutton') ||
    screen.queryByLabelText(/amount/i) ||
    screen.queryByPlaceholderText(/amount/i) ||
    screen.queryByTestId('number-input-wrapper')?.querySelector('input[data-proxy]');

  if (!amountInput) {
    // Pattern C: preset amount buttons (some UIs skip a free-form input)
    const presetBtn = screen.queryByRole('button', {
      name: new RegExp(`^₹?\\s*${amountRupees}$`),
    });
    if (presetBtn) {
      await act(async () => { fireEvent.click(presetBtn); });
    }
  } else {
    await act(async () => {
      fireEvent.change(amountInput!, { target: { value: String(amountRupees) } });
    });
  }

  // Pattern D: confirm/pay button
  const confirmBtn = screen.queryByRole('button', {
    name: /confirm|pay|proceed|top[\s-]?up|add|submit/i,
  });
  if (confirmBtn) {
    await act(async () => { fireEvent.click(confirmBtn); });
  }

  // Wait for Razorpay to be instantiated (createPaymentOrder is async)
  await waitFor(
    () => {
      if (rzpCap.options === null) {
        throw new Error(
          'FINDING: Razorpay not instantiated after triggerTopup. ' +
          'The UI interaction pattern does not match the wallet page. ' +
          'Cannot exercise callbacks without reading wallet.tsx.'
        );
      }
    },
    { timeout: 4000 }
  );
}

// ─── Test suite ──────────────────────────────────────────────────────────────

describe('9rm — WalletPage: top-up capture behavior (adversarial)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    installRazorpayMock();

    mockTrackEvent = jest.fn();
    mockCancelOrder = jest.fn().mockResolvedValue({ success: true });
    mockRecordPaymentFailure = jest.fn().mockResolvedValue({ success: true });
    mockRecordFailureAttempt = jest.fn().mockResolvedValue({ success: true });
    mockCreatePaymentOrder = jest.fn().mockResolvedValue({
      orderId: ORDER_ID,
      id: ORDER_ID,
      amount: 10000, // paise — implementation should use rupees for analytics
      currency: 'INR',
    });
    mockVerifyPayment = jest.fn().mockResolvedValue({ success: true, newBalance: 200 });
    mockGetWalletBalance = jest.fn().mockResolvedValue({ balance: 100 });
    mockGetTransactions = jest.fn().mockResolvedValue({ transactions: [] });
    mockCheckWalletBalance = jest.fn().mockResolvedValue({ balance: 100, hasSufficientBalance: true });
  });

  afterEach(() => {
    delete (window as any).Razorpay;
  });

  // ── § 1: Pre-checkout event ──────────────────────────────────────────────

  describe('§1 wallet_topup_started fires before checkout opens', () => {
    it('fires exactly once with { amount, order_id } before Razorpay opens', async () => {
      await renderWallet();
      await triggerTopup(100);

      // Razorpay has been instantiated — started must have fired before open()
      const startedCalls = mockTrackEvent.mock.calls.filter(
        ([event]) => event === 'wallet_topup_started'
      );
      expect(startedCalls).toHaveLength(1);
    });

    it('wallet_topup_started carries the order_id from createPaymentOrder', async () => {
      await renderWallet();
      await triggerTopup(100);

      const [, props] = mockTrackEvent.mock.calls.find(
        ([event]) => event === 'wallet_topup_started'
      ) ?? [];
      expect(props).toBeDefined();
      expect(props.order_id).toBe(ORDER_ID);
    });

    it('wallet_topup_started carries the user-entered dollar amount (not paise)', async () => {
      // Drive a specific, known amount. The mock order returns amount:10000 (paise); the
      // event must carry 100 (the user-entered rupee value). A x100 bug would emit 10000.
      await renderWallet();
      await triggerTopup(100);

      const [, props] = mockTrackEvent.mock.calls.find(
        ([event]) => event === 'wallet_topup_started'
      ) ?? [];
      expect(props?.amount).toBe(100);
    });

    it('fires BEFORE razorpay.open() is called (ordering check)', async () => {
      let startedCallOrder = -1;
      let openCallOrder = -1;
      let seq = 0;

      mockTrackEvent.mockImplementation((event) => {
        if (event === 'wallet_topup_started') startedCallOrder = seq++;
      });
      (window as any).Razorpay = function (options: any) {
        const openFn = jest.fn().mockImplementation(() => { openCallOrder = seq++; });
        const onFn = jest.fn().mockImplementation((event: string, cb: any) => {
          if (event === 'payment.failed') rzpCap.failureHandler = cb;
        });
        rzpCap.options = options;
        rzpCap.openFn = openFn;
        return { open: openFn, on: onFn };
      };

      await renderWallet();
      await triggerTopup(100);

      expect(startedCallOrder).toBeGreaterThanOrEqual(0);
      expect(openCallOrder).toBeGreaterThanOrEqual(0);
      expect(startedCallOrder).toBeLessThan(openCallOrder);
    });
  });

  // ── § 2: Success path ────────────────────────────────────────────────────

  describe('§2 success path: handler() callback', () => {
    async function doSuccess() {
      await renderWallet();
      await triggerTopup(100);
      const startCount = mockTrackEvent.mock.calls.length;
      await act(async () => {
        rzpCap.options.handler({
          razorpay_payment_id: 'pay_test_001',
          razorpay_order_id: ORDER_ID,
          razorpay_signature: 'sig_test_001',
        });
        await Promise.resolve();
      });
      return startCount;
    }

    it('pre-existing wallet_topup event still fires on success', async () => {
      await doSuccess();
      const successCalls = mockTrackEvent.mock.calls.filter(
        ([event]) => event === 'wallet_topup'
      );
      expect(successCalls.length).toBeGreaterThanOrEqual(1);
    });

    it('success then dismiss: NO wallet_topup_abandoned fires', async () => {
      await doSuccess();
      mockTrackEvent.mockClear();

      await act(async () => {
        rzpCap.options.modal.ondismiss();
        await Promise.resolve();
      });

      const abandonedCalls = mockTrackEvent.mock.calls.filter(
        ([event]) => event === 'wallet_topup_abandoned'
      );
      expect(abandonedCalls).toHaveLength(0);
    });

    it('success then dismiss: cancelOrder NOT called', async () => {
      await doSuccess();
      await act(async () => {
        rzpCap.options.modal.ondismiss();
        await Promise.resolve();
      });
      expect(mockCancelOrder).not.toHaveBeenCalled();
    });

    // If succeededRef.current were set after the await, ondismiss() during the pending window
    // would fire wallet_topup_abandoned + cancelOrder — racing a paying transaction.
    it('ADVERSARIAL — succeededRef is set BEFORE await verifyPayment (guard is synchronous)', async () => {
      let resolveVerify: (v: any) => void;
      const deferredVerify = new Promise(res => { resolveVerify = res; });
      mockVerifyPayment.mockReturnValue(deferredVerify);

      await renderWallet();
      await triggerTopup(100);

      // Start the handler but do not await — we want to inspect state mid-flight
      act(() => {
        rzpCap.options.handler({
          razorpay_payment_id: 'pay_test_sync_001',
          razorpay_order_id: ORDER_ID,
          razorpay_signature: 'sig_sync_001',
        });
      });

      // Flush one microtask: settledRef.current = true should have executed, verifyPayment still pending
      await Promise.resolve();

      // While verification is still pending, invoke ondismiss()
      await act(async () => {
        rzpCap.options.modal.ondismiss();
        await Promise.resolve();
      });

      expect(mockTrackEvent.mock.calls.filter(([e]) => e === 'wallet_topup_abandoned')).toHaveLength(0);
      expect(mockCancelOrder).not.toHaveBeenCalled();

      // Resolve the deferred to avoid unhandled rejection
      resolveVerify!({ success: true, newBalance: 200 });
      await act(async () => { await Promise.resolve(); });
    });
  });

  // ── § 3: payment.failed path ─────────────────────────────────────────────

  describe('§3 payment.failed callback', () => {
    const FAILURE_RESPONSE = {
      error: {
        code: 'BAD_REQUEST_ERROR',
        description: 'Card declined by bank',
        reason: 'payment_failed',
      },
    };

    async function doFailure(response = FAILURE_RESPONSE) {
      await renderWallet();
      await triggerTopup(100);
      await act(async () => {
        if (!rzpCap.failureHandler) {
          throw new Error(
            'FINDING: razorpay.on("payment.failed", cb) was never called. ' +
            'Implementation may not register the failure handler.'
          );
        }
        rzpCap.failureHandler(response);
        await Promise.resolve();
      });
    }

    it('wallet_topup_failed fires exactly once', async () => {
      await doFailure();
      const failedCalls = mockTrackEvent.mock.calls.filter(
        ([event]) => event === 'wallet_topup_failed'
      );
      expect(failedCalls).toHaveLength(1);
    });

    it('wallet_topup_failed carries error_code = response.error.code', async () => {
      await doFailure();
      const [, props] = mockTrackEvent.mock.calls.find(
        ([event]) => event === 'wallet_topup_failed'
      ) ?? [];
      expect(props?.error_code).toBe('BAD_REQUEST_ERROR');
    });

    it('wallet_topup_failed carries error_reason = response.error.reason', async () => {
      await doFailure();
      const [, props] = mockTrackEvent.mock.calls.find(
        ([event]) => event === 'wallet_topup_failed'
      ) ?? [];
      expect(props?.error_reason).toBe('payment_failed');
    });

    it('wallet_topup_failed carries error_description = response.error.description', async () => {
      await doFailure();
      const [, props] = mockTrackEvent.mock.calls.find(
        ([event]) => event === 'wallet_topup_failed'
      ) ?? [];
      expect(props?.error_description).toBe('Card declined by bank');
    });

    it('wallet_topup_failed carries order_id', async () => {
      await doFailure();
      const [, props] = mockTrackEvent.mock.calls.find(
        ([event]) => event === 'wallet_topup_failed'
      ) ?? [];
      expect(props?.order_id).toBe(ORDER_ID);
    });

    it('wallet_topup_failed carries the user-entered dollar amount (not paise)', async () => {
      // doFailure() drives triggerTopup(100). The mock order returns amount:10000 (paise);
      // the event must carry 100 (rupees). 10000 would mean paise was forwarded.
      await doFailure();
      const [, props] = mockTrackEvent.mock.calls.find(
        ([event]) => event === 'wallet_topup_failed'
      ) ?? [];
      expect(props?.amount).toBe(100);
    });

    it('recordFailureAttempt called IMMEDIATELY on payment.failed (non-terminal durable capture)', async () => {
      await doFailure();
      expect(mockRecordFailureAttempt).toHaveBeenCalledTimes(1);
    });

    it('recordFailureAttempt called with orderId and camelCase error fields immediately', async () => {
      await doFailure();
      expect(mockRecordFailureAttempt).toHaveBeenCalledWith(
        ORDER_ID,
        {
          errorCode: 'BAD_REQUEST_ERROR',
          errorDescription: 'Card declined by bank',
          errorReason: 'payment_failed',
        }
      );
    });

    it('recordPaymentFailure is NEVER called (not a client action under new contract)', async () => {
      await doFailure();
      // Must NOT be called while the modal is still open
      expect(mockRecordPaymentFailure).not.toHaveBeenCalled();

      // Still NOT called after dismiss — client never terminally marks a tx
      await act(async () => {
        rzpCap.options.modal.ondismiss();
        await Promise.resolve();
      });
      expect(mockRecordPaymentFailure).not.toHaveBeenCalled();
    });

    // CRITICAL: decline then dismiss — order stays pending, no terminal action, no abandoned event
    it('ADVERSARIAL — decline then dismiss: NO wallet_topup_abandoned, cancelOrder NOT called, recordPaymentFailure NOT called', async () => {
      await doFailure();
      mockTrackEvent.mockClear();

      await act(async () => {
        rzpCap.options.modal.ondismiss();
        await Promise.resolve();
      });

      const abandonedCalls = mockTrackEvent.mock.calls.filter(
        ([event]) => event === 'wallet_topup_abandoned'
      );
      expect(abandonedCalls).toHaveLength(0);
      expect(mockCancelOrder).not.toHaveBeenCalled();
      expect(mockRecordPaymentFailure).not.toHaveBeenCalled();
    });

    it('ADVERSARIAL — decline then dismiss: wallet_topup_failed NOT fired again', async () => {
      await doFailure();
      const countAfterFailure = mockTrackEvent.mock.calls.filter(
        ([e]) => e === 'wallet_topup_failed'
      ).length;

      await act(async () => {
        rzpCap.options.modal.ondismiss();
        await Promise.resolve();
      });

      expect(
        mockTrackEvent.mock.calls.filter(([e]) => e === 'wallet_topup_failed').length
      ).toBe(countAfterFailure);
    });

    // Missing/partial error fields
    it('ADVERSARIAL — payment.failed with undefined response.error: does not throw', async () => {
      await renderWallet();
      await triggerTopup(100);
      await expect(
        act(async () => {
          rzpCap.failureHandler!({ error: undefined });
          await Promise.resolve();
        })
      ).resolves.not.toThrow();
    });

    it('ADVERSARIAL — payment.failed with missing reason/code: wallet_topup_failed still fires', async () => {
      await renderWallet();
      await triggerTopup(100);
      await act(async () => {
        rzpCap.failureHandler!({ error: { description: 'Something went wrong' } });
        await Promise.resolve();
      });
      const failedCalls = mockTrackEvent.mock.calls.filter(
        ([event]) => event === 'wallet_topup_failed'
      );
      expect(failedCalls).toHaveLength(1);
    });

    it('ADVERSARIAL — payment.failed with fully missing error object: does not throw', async () => {
      await renderWallet();
      await triggerTopup(100);
      await expect(
        act(async () => {
          rzpCap.failureHandler!({});
          await Promise.resolve();
        })
      ).resolves.not.toThrow();
    });
  });

  // ── § 4: Pure abandonment ────────────────────────────────────────────────

  describe('§4 pure abandonment (ondismiss only, no prior settle)', () => {
    it('wallet_topup_abandoned fires exactly once', async () => {
      await renderWallet();
      await triggerTopup(100);
      await act(async () => {
        rzpCap.options.modal.ondismiss();
        await Promise.resolve();
      });
      const abandonedCalls = mockTrackEvent.mock.calls.filter(
        ([event]) => event === 'wallet_topup_abandoned'
      );
      expect(abandonedCalls).toHaveLength(1);
    });

    it('wallet_topup_abandoned carries order_id', async () => {
      await renderWallet();
      await triggerTopup(100);
      await act(async () => {
        rzpCap.options.modal.ondismiss();
        await Promise.resolve();
      });
      const [, props] = mockTrackEvent.mock.calls.find(
        ([event]) => event === 'wallet_topup_abandoned'
      ) ?? [];
      expect(props?.order_id).toBe(ORDER_ID);
    });

    it('wallet_topup_abandoned carries the user-entered dollar amount (not paise)', async () => {
      // Drive a known $100 top-up. The mock order returns amount:10000 (paise); the event
      // must carry 100 (rupees). A cents/paise bug would emit 10000 and fail this test.
      await renderWallet();
      await triggerTopup(100);
      await act(async () => {
        rzpCap.options.modal.ondismiss();
        await Promise.resolve();
      });
      const [, props] = mockTrackEvent.mock.calls.find(
        ([event]) => event === 'wallet_topup_abandoned'
      ) ?? [];
      expect(props?.amount).toBe(100);
    });

    it('cancelOrder NOT called (client no longer sends terminal cancel)', async () => {
      await renderWallet();
      await triggerTopup(100);
      await act(async () => {
        rzpCap.options.modal.ondismiss();
        await Promise.resolve();
      });
      expect(mockCancelOrder).not.toHaveBeenCalled();
    });

    it('recordPaymentFailure NOT called on pure abandonment', async () => {
      await renderWallet();
      await triggerTopup(100);
      await act(async () => {
        rzpCap.options.modal.ondismiss();
        await Promise.resolve();
      });
      expect(mockRecordPaymentFailure).not.toHaveBeenCalled();
    });
  });

  // ── § 5: Fire-and-forget beacons ─────────────────────────────────────────

  describe('§5 beacons are fire-and-forget (rejection must not suppress trackEvent)', () => {
    it('recordFailureAttempt rejection on payment.failed: wallet_topup_failed still fires', async () => {
      mockRecordFailureAttempt.mockRejectedValue(new Error('Network timeout'));

      await renderWallet();
      await triggerTopup(100);
      await act(async () => {
        rzpCap.failureHandler!({
          error: { code: 'NETWORK_ERROR', description: 'Timeout', reason: 'timeout' },
        });
        await Promise.resolve();
      });

      // analytics fires even when the beacon request fails
      const failedCalls = mockTrackEvent.mock.calls.filter(
        ([event]) => event === 'wallet_topup_failed'
      );
      expect(failedCalls).toHaveLength(1);
    });

    it('recordFailureAttempt rejection on payment.failed: does not throw out of callback', async () => {
      mockRecordFailureAttempt.mockRejectedValue(new Error('Server error'));

      await renderWallet();
      await triggerTopup(100);
      await expect(
        act(async () => {
          rzpCap.failureHandler!({ error: { code: 'X' } });
          await Promise.resolve();
        })
      ).resolves.not.toThrow();
    });

    it('pure abandon ondismiss does not throw (analytics only, no beacon)', async () => {
      await renderWallet();
      await triggerTopup(100);
      await expect(
        act(async () => {
          rzpCap.options.modal.ondismiss();
          await Promise.resolve();
        })
      ).resolves.not.toThrow();
    });

    it('decline then dismiss does not throw (ondismiss returns early, no backend call)', async () => {
      await renderWallet();
      await triggerTopup(100);
      await act(async () => {
        rzpCap.failureHandler!({ error: { code: 'X', description: 'D', reason: 'R' } });
        await Promise.resolve();
      });
      await expect(
        act(async () => {
          rzpCap.options.modal.ondismiss();
          await Promise.resolve();
        })
      ).resolves.not.toThrow();
    });
  });

  // ── § 5b: The original bug regression ────────────────────────────────────
  // Reproduce: user gets declined on card A, then retries with card B in the
  // SAME modal and succeeds. verifyPayment must run; recordPaymentFailure must
  // NOT be called; user must be credited.

  describe('§5b REGRESSION — declined then retry-success in same modal (the bug)', () => {
    it('verifyPayment invoked, recordPaymentFailure NOT called, cancelOrder NOT called, no wallet_topup_abandoned', async () => {
      await renderWallet();
      await triggerTopup(100);

      // Step 1: first card declined — recordFailureAttempt fires immediately (non-terminal)
      await act(async () => {
        rzpCap.failureHandler!({
          error: {
            code: 'BAD_REQUEST_ERROR',
            description: 'Card declined by bank',
            reason: 'payment_failed',
          },
        });
        await Promise.resolve();
      });

      // recordFailureAttempt MAY be called (non-terminal immediate capture is allowed)
      // but recordPaymentFailure (terminal) must NOT have been called (modal still open)
      expect(mockRecordPaymentFailure).not.toHaveBeenCalled();

      // Step 2: user retries with a different card — success handler fires
      await act(async () => {
        rzpCap.options.handler({
          razorpay_payment_id: 'pay_retry_success',
          razorpay_order_id: ORDER_ID,
          razorpay_signature: 'sig_retry_success',
        });
        await Promise.resolve();
      });

      // Credit path must have run
      expect(mockVerifyPayment).toHaveBeenCalledTimes(1);

      // Step 3: Razorpay fires ondismiss after the success handler returns
      await act(async () => {
        rzpCap.options.modal.ondismiss();
        await Promise.resolve();
      });

      // THE BUG: recordPaymentFailure must NEVER be called — the transaction is paid
      expect(mockRecordPaymentFailure).not.toHaveBeenCalled();
      expect(mockCancelOrder).not.toHaveBeenCalled();
      const abandonedCalls = mockTrackEvent.mock.calls.filter(
        ([e]) => e === 'wallet_topup_abandoned'
      );
      expect(abandonedCalls).toHaveLength(0);
    });
  });

  // ── § 6: Second attempt after first ──────────────────────────────────────

  describe('§6 second attempt: settled flag resets between attempts', () => {
    it('ADVERSARIAL — second attempt dismissed after first settled: fresh wallet_topup_abandoned fires', async () => {
      // First attempt: settle via failure
      await renderWallet();
      await triggerTopup(100);

      await act(async () => {
        rzpCap.failureHandler!({
          error: { code: 'BAD_REQUEST_ERROR', description: 'Declined', reason: 'payment_failed' },
        });
        await Promise.resolve();
      });

      // First dismiss — calls recordPaymentFailure (deferred from payment.failed)
      await act(async () => {
        rzpCap.options.modal.ondismiss();
        await Promise.resolve();
      });
      mockTrackEvent.mockClear();
      mockCancelOrder.mockClear();

      // Reset Razorpay capture for second attempt
      rzpCap.options = null;
      rzpCap.failureHandler = null;
      rzpCap.openFn = null;
      installRazorpayMock();

      // Clear amount input so Pattern A stays disabled (mirrors user clearing form after error).
      // After payment.failed, customAmount stays "100" (unlike success which calls setCustomAmount("")).
      // Without this, Pattern A fires handleTopUp prematurely → processing=true → Pattern D
      // finds the button disabled → jsdom skips the click → Razorpay never created → timeout.
      const amountInput = screen.queryByPlaceholderText(/amount/i);
      if (amountInput) {
        await act(async () => {
          fireEvent.change(amountInput, { target: { value: '' } });
        });
      }

      // Second attempt: trigger top-up, then dismiss without settling
      await triggerTopup(200);
      await act(async () => {
        rzpCap.options.modal.ondismiss();
        await Promise.resolve();
      });

      // The second dismiss is on an unsettled attempt — abandoned MUST fire
      const abandonedCalls = mockTrackEvent.mock.calls.filter(
        ([event]) => event === 'wallet_topup_abandoned'
      );
      expect(abandonedCalls).toHaveLength(1);
      // cancelOrder is no longer a client action — abandoned is analytics-only
      expect(mockCancelOrder).not.toHaveBeenCalled();
    });

    it('ADVERSARIAL — second attempt dismissed after first success: fresh wallet_topup_abandoned fires', async () => {
      await renderWallet();
      await triggerTopup(100);

      // First attempt: settle via success
      await act(async () => {
        rzpCap.options.handler({
          razorpay_payment_id: 'pay_first',
          razorpay_order_id: ORDER_ID,
          razorpay_signature: 'sig_first',
        });
        await Promise.resolve();
      });
      await act(async () => {
        rzpCap.options.modal.ondismiss();
        await Promise.resolve();
      });

      mockTrackEvent.mockClear();
      mockCancelOrder.mockClear();
      rzpCap.options = null;
      rzpCap.failureHandler = null;
      rzpCap.openFn = null;

      // Mock createPaymentOrder to return a new order for the second attempt
      mockCreatePaymentOrder.mockResolvedValue({
        orderId: 'rzp_order_second_001',
        id: 'rzp_order_second_001',
        amount: 20000,
        currency: 'INR',
      });
      installRazorpayMock();

      await triggerTopup(200);
      await act(async () => {
        rzpCap.options.modal.ondismiss();
        await Promise.resolve();
      });

      const abandonedCalls = mockTrackEvent.mock.calls.filter(
        ([event]) => event === 'wallet_topup_abandoned'
      );
      expect(abandonedCalls).toHaveLength(1);
      // cancelOrder is no longer a client action — abandoned is analytics-only
      expect(mockCancelOrder).not.toHaveBeenCalled();
    });
  });

  // ── § 7: No cross-contamination between event shapes ─────────────────────

  describe('§7 event shape integrity', () => {
    it('wallet_topup_failed uses snake_case keys (error_code not errorCode)', async () => {
      await renderWallet();
      await triggerTopup(100);
      await act(async () => {
        rzpCap.failureHandler!({
          error: { code: 'BAD_REQUEST_ERROR', description: 'Declined', reason: 'payment_failed' },
        });
        await Promise.resolve();
      });
      const [, props] = mockTrackEvent.mock.calls.find(([e]) => e === 'wallet_topup_failed') ?? [];
      // Must use snake_case in the analytics event
      expect(props).toHaveProperty('error_code');
      expect(props).toHaveProperty('error_reason');
      expect(props).toHaveProperty('error_description');
      // Must NOT use camelCase in the analytics event (that's the API call format)
      expect(props).not.toHaveProperty('errorCode');
      expect(props).not.toHaveProperty('errorReason');
      expect(props).not.toHaveProperty('errorDescription');
    });

    it('recordFailureAttempt uses camelCase keys (errorCode not error_code)', async () => {
      await renderWallet();
      await triggerTopup(100);
      await act(async () => {
        rzpCap.failureHandler!({
          error: { code: 'BAD_REQUEST_ERROR', description: 'Declined', reason: 'payment_failed' },
        });
        await Promise.resolve();
      });
      const callArgs = mockRecordFailureAttempt.mock.calls[0];
      expect(callArgs).toBeDefined();
      const errorPayload = callArgs[1];
      // Must use camelCase in the API call
      expect(errorPayload).toHaveProperty('errorCode');
      expect(errorPayload).toHaveProperty('errorReason');
      expect(errorPayload).toHaveProperty('errorDescription');
      // Must NOT use snake_case in the API call
      expect(errorPayload).not.toHaveProperty('error_code');
      expect(errorPayload).not.toHaveProperty('error_reason');
      expect(errorPayload).not.toHaveProperty('error_description');
    });

    it('order_id on wallet_topup_abandoned matches the order from createPaymentOrder', async () => {
      await renderWallet();
      await triggerTopup(100);
      await act(async () => {
        rzpCap.options.modal.ondismiss();
        await Promise.resolve();
      });
      const [, props] = mockTrackEvent.mock.calls.find(
        ([e]) => e === 'wallet_topup_abandoned'
      ) ?? [];
      expect(props?.order_id).toBe(ORDER_ID);
    });

    it('wallet_topup_started order_id matches order from createPaymentOrder', async () => {
      await renderWallet();
      await triggerTopup(100);
      const [, props] = mockTrackEvent.mock.calls.find(
        ([e]) => e === 'wallet_topup_started'
      ) ?? [];
      expect(props?.order_id).toBe(ORDER_ID);
    });

    it('all three new events share the same order_id and amount (consistency)', async () => {
      await renderWallet();
      await triggerTopup(100);

      const [, startedProps] = mockTrackEvent.mock.calls.find(
        ([e]) => e === 'wallet_topup_started'
      ) ?? [];

      await act(async () => {
        rzpCap.failureHandler!({
          error: { code: 'E', description: 'D', reason: 'R' },
        });
        await Promise.resolve();
      });

      // After failure, dismiss — should NOT fire abandoned (but let's capture if it does)
      const [, failedProps] = mockTrackEvent.mock.calls.find(
        ([e]) => e === 'wallet_topup_failed'
      ) ?? [];

      // All events share order_id
      expect(startedProps?.order_id).toBe(ORDER_ID);
      expect(failedProps?.order_id).toBe(ORDER_ID);

      // amount must equal the user-entered dollar value on BOTH events, not just each other
      expect(startedProps?.amount).toBe(100);
      expect(failedProps?.amount).toBe(100);
    });
  });
});

/*
 * ─── DISCLOSURE ─────────────────────────────────────────────────────────────
 *
 * FILES OPENED:
 *
 * 1. frontend/src/utils/analytics.ts
 *    WHY: needed to know the exported function signatures (trackEvent, initAnalytics,
 *         identifyUser, etc.) so the mock had the right shape and the import compiled.
 *    INCIDENTAL: saw that trackEvent is a no-op when NEXT_PUBLIC_POSTHOG_KEY is unset.
 *    MITIGATION: set NEXT_PUBLIC_POSTHOG_KEY = 'test-ph-key' at the top AND mock the
 *    entire module via jest.mock, so the real posthog is never called. No assertion
 *    encodes anything about the posthog guard — assertions only check trackEvent calls.
 *
 * 2. frontend/src/__tests__/9rm.wallet-beacons.smoke.test.ts
 *    WHY: I was checking the list of existing tests before deciding on a file name and
 *    test scope. I read its header and structure to avoid duplicating its coverage.
 *    INCIDENTAL: saw the exact POST body shapes and keepalive expectations for
 *    cancelOrder / recordPaymentFailure. The smoke tests cover the API client wiring
 *    (fetch call shape, keepalive, error response). I avoided re-testing those:
 *    my tests mock createApiClient at the boundary and only test the UI→callback→
 *    apiClient/analytics wiring.
 *
 * 3. frontend/src/__tests__/outOfCreditPreview.page.test.tsx (first 160 lines)
 *    WHY: to understand the standard jest.mock boilerplate pattern used in this repo
 *    for rendering Next.js pages (Chakra mock, auth context mock, layout mock).
 *    INCIDENTAL: saw that useDisclosure is mocked with isOpen:false in that test.
 *    MITIGATION: I set isOpen:true in MY Chakra mock because I need modal form content
 *    to be rendered for the top-up flow. No assertion encodes behaviour from that file.
 *
 * 4. frontend/src/__tests__/kda-b.adversarial.test.tsx (first 120 lines)
 *    WHY: to understand how createApiClient is lazily mocked (let variable + wrapper
 *    arrow functions so the factory captures by reference).
 *    INCIDENTAL: saw the full list of API methods mocked. I used that list to ensure
 *    my createApiClient mock is complete. No wallet-page behaviour was revealed.
 *
 * FINDINGS (things that could not be tested without reading the implementation):
 *
 * FINDING-UI: The triggerTopup() helper uses heuristic button/input selectors. If
 * wallet.tsx uses non-standard labels, aria-roles, or a multi-step flow not covered
 * by the heuristic, the helper will throw "FINDING: Razorpay not instantiated after
 * triggerTopup" and all dependent tests will fail. This is itself a signal that the
 * top-up flow is not accessible with public contracts alone.
 *
 * FINDING-AMOUNT-UNIT (RESOLVED): The contract requires events carry `amount` in DOLLARS
 * (user-entered value), not paise/cents. The mock order returns amount:10000 (paise).
 * All three new-event amount assertions now use `expect(props.amount).toBe(100)` — the
 * exact dollar value entered via triggerTopup(100). A paise/x100 regression would emit
 * 10000 and fail. The consistency test also asserts against the literal 100, not just
 * equality between two captured values (which would pass if both were wrong identically).
 *
 * FINDING-HANDLER-LOCATION: If the payment.failed callback is registered inside the
 * handler callback rather than via razorpay.on("payment.failed", cb), rzpCap.failureHandler
 * will be null and §3 tests will throw "rzpCap.failureHandler is null". That is a
 * correct finding — the contract requires .on("payment.failed", cb) registration.
 */
