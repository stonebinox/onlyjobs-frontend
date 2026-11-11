/**
 * 6a4p ADVERSARIAL: Purchase wiring (R7) + create-order click transport (R11).
 * Real wallet page + REAL apiClient (fetch mocked at the network boundary: no double-mocked seam).
 * Chakra/next/layout mocks copied from the 9rm wallet harness. wallet.tsx is a black box.
 */
process.env.NEXT_PUBLIC_API_URL = 'http://api.test.local/api';
process.env.NEXT_PUBLIC_META_PIXEL_ID = '333000111222333';

import React from 'react';
import { installFbqRecorder, FbqRecorder, setUrl, clearCookies } from './6a4p.helpers';

let mockTrackEvent: jest.Mock = jest.fn();
jest.mock('@/utils/analytics', () => ({
  __esModule: true,
  trackEvent: (...args: any[]) => mockTrackEvent(...args),
  initAnalytics: jest.fn(), trackPageView: jest.fn(), identifyUser: jest.fn(),
  resetAnalyticsUser: jest.fn(), setUserPersonProperties: jest.fn(),
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
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import WalletPage from '@/pages/wallet';
import { captureMetaClick } from '@/utils/metaClick';

const rzp: { options: any } = { options: null };
let rec: FbqRecorder;
let fetchCalls: { url: string; method: string; body: any }[] = [];
let verifyBody: any;
let verifyStatus = 200;

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
  verifyStatus = 200;
  verifyBody = { success: true, newBalance: 200, metaEventId: 'purchase_default', value: 10, currency: 'USD' };
  mockTrackEvent = jest.fn();
  sessionStorage.clear(); localStorage.clear(); clearCookies(); setUrl('/wallet');
  rzp.options = null;
  (window as any).Razorpay = function (options: any) {
    rzp.options = options;
    return { open: jest.fn(), on: jest.fn() };
  };
  (global as any).fetch = jest.fn(async (url: any, init: any = {}) => {
    const u = String(url);
    const method = (init.method || 'GET').toUpperCase();
    let body: any;
    try { body = init.body ? JSON.parse(init.body) : undefined; } catch { body = init.body; }
    fetchCalls.push({ url: u, method, body });
    if (/create-order/.test(u)) return mkResp({ orderId: 'order_1', id: 'order_1', amount: 10000, currency: 'INR' });
    if (/verify-payment/.test(u)) return mkResp(verifyBody, verifyStatus);
    if (/wallet\/balance|check-balance|balance/.test(u)) return mkResp({ balance: 100, hasSufficientBalance: true });
    if (/transactions/.test(u)) return mkResp({ transactions: [] });
    return mkResp({});
  });
});
afterEach(() => { delete (window as any).Razorpay; });

async function renderWallet() {
  render(<WalletPage />);
  await act(async () => { for (let i = 0; i < 10; i++) await Promise.resolve(); });
}
async function triggerTopup(amount = 100) {
  const openFormBtn = screen.queryByRole('button', { name: /add funds|top[\s-]?up|recharge|add money/i });
  if (openFormBtn) await act(async () => { fireEvent.click(openFormBtn); });
  const amountInput =
    screen.queryByRole('spinbutton') || screen.queryByLabelText(/amount/i) || screen.queryByPlaceholderText(/amount/i) ||
    screen.queryByTestId('number-input-wrapper')?.querySelector('input[data-proxy]');
  if (amountInput) await act(async () => { fireEvent.change(amountInput as Element, { target: { value: String(amount) } }); });
  const confirmBtn = screen.queryByRole('button', { name: /confirm|pay|proceed|top[\s-]?up|add|submit/i });
  if (confirmBtn) await act(async () => { fireEvent.click(confirmBtn); });
  await waitFor(() => { if (!rzp.options) throw new Error('Razorpay never instantiated (harness/UI drive failed)'); }, { timeout: 4000 });
}
const payOk = async () => {
  await act(async () => {
    rzp.options.handler({ razorpay_payment_id: 'pay_1', razorpay_order_id: 'order_1', razorpay_signature: 'sig_1' });
    for (let i = 0; i < 30; i++) await Promise.resolve();
  });
};
const purchases = () => rec.calls.filter((c) => c[0] === 'track' && c[1] === 'Purchase');
const anyPurchase = () => rec.calls.filter((c) => /Purchase/.test(JSON.stringify(c)));
const verifyCalls = () => fetchCalls.filter((c) => /verify-payment/.test(c.url) && c.method === 'POST');
const createCalls = () => fetchCalls.filter((c) => /create-order/.test(c.url) && c.method === 'POST');

describe('R7 Purchase', () => {
  it('verify-payment response with metaEventId/value/currency -> exactly one fbq Purchase {value,currency} with eventID', async () => {
    verifyBody = { success: true, newBalance: 200, metaEventId: 'purchase_abc', value: 10, currency: 'USD' };
    await renderWallet(); await triggerTopup(100); await payOk();
    expect(verifyCalls()).toHaveLength(1);
    expect(purchases()).toEqual([['track', 'Purchase', { value: 10, currency: 'USD' }, { eventID: 'purchase_abc' }]]);
  });

  it('params come from the verify response, not from the order (paise/INR) or entered amount', async () => {
    verifyBody = { success: true, newBalance: 200, metaEventId: 'purchase_src', value: 1.25, currency: 'USD' };
    await renderWallet(); await triggerTopup(100); await payOk();
    const p = purchases();
    expect(p).toHaveLength(1);
    expect(p[0][2]).toEqual({ value: 1.25, currency: 'USD' });
    expect(Object.keys(p[0][2]).sort()).toEqual(['currency', 'value']);
  });

  it('no metaEventId -> no Purchase', async () => {
    verifyBody = { success: true, newBalance: 200, value: 10, currency: 'USD' };
    await renderWallet(); await triggerTopup(100); await payOk();
    expect(verifyCalls()).toHaveLength(1);
    expect(anyPurchase()).toHaveLength(0);
  });

  it.each([
    ['value missing', { metaEventId: 'purchase_nv', currency: 'USD' }],
    ['currency missing', { metaEventId: 'purchase_nc', value: 10 }],
    ['value is a numeric string', { metaEventId: 'purchase_sv', value: '10', currency: 'USD' }],
    ['value is null', { metaEventId: 'purchase_nl', value: null, currency: 'USD' }],
    ['value is NaN-like string', { metaEventId: 'purchase_nan', value: 'abc', currency: 'USD' }],
  ])('incomplete/ill-typed response (%s) -> no Purchase', async (_n, extra) => {
    verifyBody = { success: true, newBalance: 200, ...extra };
    await renderWallet(); await triggerTopup(100); await payOk();
    expect(anyPurchase()).toHaveLength(0);
  });

  it('numeric value 0 is numeric (falsy-zero trap): spec-literal, Purchase still fires with value 0', async () => {
    verifyBody = { success: true, newBalance: 200, metaEventId: 'purchase_zero', value: 0, currency: 'USD' };
    await renderWallet(); await triggerTopup(100); await payOk();
    expect(purchases()).toHaveLength(1);
    expect(purchases()[0][2].value).toBe(0);
  });

  it('verify-payment HTTP error -> no Purchase even if body has the fields', async () => {
    verifyStatus = 400;
    verifyBody = { error: 'bad signature', metaEventId: 'purchase_err', value: 10, currency: 'USD' };
    await renderWallet(); await triggerTopup(100); await payOk();
    expect(anyPurchase()).toHaveLength(0);
  });

  it('razorpay handler invoked twice with same order -> eventID dedupes to one Purchase', async () => {
    verifyBody = { success: true, newBalance: 200, metaEventId: 'purchase_twice', value: 10, currency: 'USD' };
    await renderWallet(); await triggerTopup(100); await payOk(); await payOk();
    expect(purchases().filter((c) => c[3]?.eventID === 'purchase_twice')).toHaveLength(1);
  });

  it('Purchase carries no PII/order/payment ids in params', async () => {
    await renderWallet(); await triggerTopup(100); await payOk();
    const s = JSON.stringify(purchases());
    expect(s).not.toMatch(/pay_1|order_1|sig_1|@/);
  });

  it('opening the wallet page alone (no payment) never fires Purchase', async () => {
    await renderWallet();
    expect(anyPurchase()).toHaveLength(0);
  });
});

describe('R11 click data (create-order)', () => {
  it('POST create-order body has top-level metaClick; click ids not inside attribution', async () => {
    setUrl('/?fbclid=Wallet_Click.1');
    captureMetaClick();
    document.cookie = '_fbp=fb.1.1700000000000.424242; path=/';
    setUrl('/wallet');
    await renderWallet(); await triggerTopup(100);
    const c = createCalls()[0];
    expect(c).toBeDefined();
    expect(c.body.metaClick?.fbclid).toBe('Wallet_Click.1');
    expect(c.body.metaClick?.fbc).toMatch(/^fb\.1\.\d+\.Wallet_Click\.1$/);
    expect(c.body.metaClick?.fbp).toBe('fb.1.1700000000000.424242');
    expect(JSON.stringify(c.body.attribution ?? {})).not.toMatch(/fbclid|fbc|fbp|Wallet_Click/);
    const rest = { ...c.body }; delete rest.metaClick;
    expect(JSON.stringify(rest)).not.toMatch(/fbclid|fbc|fbp|Wallet_Click/);
  });

  it('click ids never reach analytics trackEvent payloads from the wallet flow', async () => {
    setUrl('/?fbclid=Wallet_NoPH');
    captureMetaClick();
    setUrl('/wallet');
    await renderWallet(); await triggerTopup(100); await payOk();
    expect(JSON.stringify(mockTrackEvent.mock.calls)).not.toMatch(/fbclid|fbc|fbp|Wallet_NoPH/);
  });

  it('no stored click: order still created (metaClick absent or empty)', async () => {
    await renderWallet(); await triggerTopup(100);
    const c = createCalls()[0];
    expect(c).toBeDefined();
    const mc = c.body.metaClick;
    expect(mc === undefined || mc === null || Object.values(mc).every((v) => v === undefined || v === '')).toBe(true);
  });
});
