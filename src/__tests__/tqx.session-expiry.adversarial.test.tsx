/**
 * ADVERSARIAL TESTS — onlyjobs-tqx: Session Expiry Error Handling in JobChatSection
 *
 * Assume the implementation is subtly wrong. Tests are written black-box to EXPOSE bugs.
 * Report pass/fail — failures are FINDINGS. Do NOT modify production code. Do NOT commit.
 *
 * FORBIDDEN (not opened): src/components/Dashboard/JobChatSection.tsx
 *
 * CONTRACT (oracle — all assertions trace here):
 *   AUTH-EXPIRY LOAD: createOrGetJobConversation fails (thrown OR resolved {error}) with a
 *     string that case-insensitively contains "session expired", "session has expired",
 *     or "not authorized" → show EXACTLY "Your session has expired. Please log in again.",
 *     NO Retry button.
 *   AUTH-EXPIRY SEND: sendChatMessage fails with same auth string → same exact message,
 *     NO Retry, optimistic user message rolled back from transcript.
 *   NON-AUTH LOAD: non-auth failure → error message or fallback "Failed to load conversation.",
 *     Retry button present.
 *   NON-AUTH SEND: non-auth failure → Retry button present, NOT auth message, rollback.
 *   NEGATIVE: benign strings containing "session", "expired", or "unauthorized" (but NOT
 *     the trigger phrases) must NOT be classified as auth-expiry — must show Retry.
 *   78n INVARIANTS: no LLM on mount; prior messages rendered; successful send appends reply.
 *
 * DISCLOSURE: see bottom of file.
 */

// ── Mock control variables ────────────────────────────────────────────────────

let mockCreateOrGetJobConversation: jest.Mock;
let mockSendChatMessage: jest.Mock;

// ── apiClient mock ────────────────────────────────────────────────────────────

jest.mock('@/lib/apiClient', () => ({
  __esModule: true,
  createApiClient: () => ({
    createOrGetJobConversation: (...args: any[]) => mockCreateOrGetJobConversation(...args),
    sendChatMessage: (...args: any[]) => mockSendChatMessage(...args),
    getMatches: jest.fn().mockResolvedValue([]),
    getTracker: jest.fn().mockResolvedValue([]),
    touchSession: jest.fn().mockResolvedValue(undefined),
    getUserProfile: jest.fn().mockResolvedValue(null),
    getChatConversations: jest.fn().mockResolvedValue([]),
    getChatConversation: jest.fn().mockResolvedValue({}),
    getChatMemory: jest.fn().mockResolvedValue({}),
    deleteChatMemory: jest.fn().mockResolvedValue({}),
  }),
}));

// ── Chakra UI mock ────────────────────────────────────────────────────────────

jest.mock('@chakra-ui/react', () => {
  const React = require('react');
  const cache: Record<string, any> = {};

  const makeEl = (tag: string) => {
    if (cache[tag]) return cache[tag];
    const C = React.forwardRef(
      (
        {
          children, onClick, onKeyDown, onChange, onKeyPress,
          value, defaultValue, type, disabled, isDisabled,
          'aria-label': al, 'data-testid': dt, href, role,
          placeholder, isLoading,
          dangerouslySetInnerHTML,
          ...rest
        }: any,
        ref: any
      ) => {
        const props: any = {
          ref, onClick, onKeyDown, onChange, onKeyPress,
          value, defaultValue, type,
          disabled: disabled || isDisabled || isLoading || undefined,
          'aria-label': al, 'data-testid': dt, href, role, placeholder,
        };
        if (dangerouslySetInnerHTML) {
          props.dangerouslySetInnerHTML = dangerouslySetInnerHTML;
          return React.createElement(tag, props);
        }
        return React.createElement(tag, props, children);
      }
    );
    C.displayName = tag;
    cache[tag] = C;
    return C;
  };

  const known: Record<string, any> = {
    __esModule: true,
    ChakraProvider: ({ children }: any) => React.createElement(React.Fragment, null, children),
    Box: makeEl('div'), Flex: makeEl('div'), VStack: makeEl('div'),
    HStack: makeEl('div'), Stack: makeEl('div'), Wrap: makeEl('div'),
    WrapItem: makeEl('div'), Container: makeEl('div'), Center: makeEl('div'),
    Grid: makeEl('div'), GridItem: makeEl('div'), SimpleGrid: makeEl('div'),
    Text: makeEl('span'), Heading: makeEl('h3'),
    Button: makeEl('button'),
    IconButton: ({ 'aria-label': al, onClick, children, isDisabled, disabled, isLoading }: any) =>
      React.createElement(
        'button',
        { 'aria-label': al, onClick, disabled: isDisabled || disabled || isLoading || undefined },
        children ?? null
      ),
    Link: ({ children, href, onClick }: any) =>
      React.createElement('a', { href, onClick }, children),
    Badge: makeEl('span'), Tag: makeEl('span'),
    TagLabel: ({ children }: any) => React.createElement('span', null, children),
    Divider: () => React.createElement('hr'),
    Spinner: () => React.createElement('div', { role: 'status', 'aria-label': 'Loading' }),
    Alert: ({ children, role: r }: any) =>
      React.createElement('div', { role: r ?? 'alert' }, children),
    AlertIcon: () => null,
    AlertTitle: makeEl('span'),
    AlertDescription: makeEl('span'),
    // eslint-disable-next-line react/display-name
    Input: React.forwardRef(
      ({ value, onChange, disabled, isDisabled, placeholder, type, onKeyPress, onKeyDown, ...rest }: any, ref: any) =>
        React.createElement('input', {
          ref, value, onChange, placeholder, type, onKeyPress, onKeyDown,
          disabled: disabled || isDisabled || undefined,
        })
    ),
    // eslint-disable-next-line react/display-name
    Textarea: React.forwardRef(
      ({ value, onChange, disabled, isDisabled, placeholder, onKeyPress, onKeyDown, ...rest }: any, ref: any) =>
        React.createElement('textarea', {
          ref, value, onChange, placeholder, onKeyPress, onKeyDown,
          disabled: disabled || isDisabled || undefined,
        })
    ),
    Select: makeEl('select'), FormControl: makeEl('div'), FormLabel: makeEl('label'),
    FormErrorMessage: makeEl('span'), FormHelperText: makeEl('span'),
    InputGroup: makeEl('div'), InputLeftElement: makeEl('span'), InputRightElement: makeEl('span'),
    Tooltip: ({ children }: any) => children,
    Modal: ({ isOpen, children }: any) =>
      isOpen ? React.createElement(React.Fragment, null, children) : null,
    ModalContent: ({ children }: any) =>
      React.createElement('div', { role: 'dialog' }, children),
    ModalHeader: ({ children }: any) => React.createElement('h2', null, children),
    ModalBody: ({ children }: any) => React.createElement('div', null, children),
    ModalFooter: ({ children }: any) => React.createElement('div', null, children),
    ModalCloseButton: ({ onClick }: any) =>
      React.createElement('button', { onClick }, 'Close'),
    Skeleton: ({ children }: any) => React.createElement('div', null, children),
    Image: makeEl('img'), Progress: makeEl('div'),
    useColorModeValue: (light: any) => light,
    useDisclosure: () => {
      const [isOpen, setIsOpen] = React.useState(false);
      return {
        isOpen,
        onOpen: () => setIsOpen(true),
        onClose: () => setIsOpen(false),
        onToggle: () => setIsOpen((v: boolean) => !v),
      };
    },
    useToast: () => jest.fn(),
    useBreakpointValue: (vals: any) => {
      if (vals && typeof vals === 'object')
        return vals.base ?? vals.sm ?? vals.md ?? Object.values(vals)[0];
      return vals;
    },
    extendTheme: (t: any) => t,
    createStandaloneToast: () => ({ toast: jest.fn() }),
    useMultiStyleConfig: () => ({}),
    StylesProvider: ({ children }: any) => children,
    useStyles: () => ({}),
  };

  return new Proxy(known, {
    get(target, prop) {
      if (prop in target) return Reflect.get(target, prop);
      if (typeof prop === 'string') {
        if (prop.startsWith('use')) {
          if (!cache[`hook:${prop}`]) cache[`hook:${prop}`] = () => ({});
          return cache[`hook:${prop}`];
        }
        return makeEl('div');
      }
      return Reflect.get(target, prop);
    },
  });
});

// ── Icon stubs ────────────────────────────────────────────────────────────────

const nullIconProxy = new Proxy({}, { get: () => () => null });
jest.mock('react-icons/fi', () => nullIconProxy);
jest.mock('react-icons/bs', () => nullIconProxy);
jest.mock('react-icons/md', () => nullIconProxy);
jest.mock('react-icons/ai', () => nullIconProxy);
jest.mock('react-icons/io', () => nullIconProxy);
jest.mock('react-icons/io5', () => nullIconProxy);
jest.mock('react-icons/hi', () => nullIconProxy);
jest.mock('react-icons/ri', () => nullIconProxy);
jest.mock('react-icons/tb', () => nullIconProxy);
jest.mock('react-icons/lu', () => nullIconProxy);
jest.mock('react-icons/fa', () => nullIconProxy);

jest.mock('@emotion/react', () => ({
  keyframes: () => 'mock-keyframes',
  css: (...args: any[]) => args,
}));

jest.mock('@/theme/theme', () => ({
  __esModule: true,
  default: {
    colors: {
      brand:    { 50: '#EEF4FB', 500: '#1D4E89', 600: '#163B69', 700: '#112D50' },
      gray:     { 50: '#F9FAFB', 100: '#F3F4F6', 200: '#E5E7EB', 500: '#6B7280' },
    },
  },
}));

jest.mock('@/utils/analytics', () => ({
  initAnalytics: jest.fn(),
  trackPageView: jest.fn(),
  trackEvent: jest.fn(),
  identifyUser: jest.fn(),
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { JobChatSection } from '@/components/Dashboard/JobChatSection';

// ── Constants ────────────────────────────────────────────────────────────────

/** The exact string the component MUST show on auth-expiry. Assert with getByText, not regex. */
const AUTH_EXPIRY_MSG = 'Your session has expired. Please log in again.';
const MATCH_ID = 'match-tqx-adv';
const CONV_ID  = 'conv-tqx-adv';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Render and wait until the loading spinner is gone (component settled). */
async function renderAndSettle(matchId = MATCH_ID) {
  render(<JobChatSection matchId={matchId} />);
  await waitFor(
    () => expect(screen.queryByRole('status')).not.toBeInTheDocument(),
    { timeout: 5000 }
  );
  await act(async () => {});
}

/** Render with a successful load (empty message history) and wait for settled state. */
async function renderLoaded() {
  mockCreateOrGetJobConversation.mockResolvedValue({
    conversationId: CONV_ID,
    messages: [],
  });
  await renderAndSettle();
}

/** Find the send button by accessible name or text (case-insensitive "send"). */
function findSendButton(): HTMLButtonElement | null {
  const btn = Array.from(document.querySelectorAll('button')).find(b =>
    /send/i.test(b.getAttribute('aria-label') ?? '') ||
    /^send$/i.test((b.textContent ?? '').trim())
  );
  return (btn as HTMLButtonElement) ?? null;
}

/** Find the message input (last non-submit input or textarea on the page). */
function findMessageInput(): HTMLElement | null {
  const inputs = document.querySelectorAll(
    'input:not([type="submit"]):not([type="button"]):not([type="checkbox"]), textarea'
  );
  return (inputs[inputs.length - 1] as HTMLElement) ?? null;
}

/**
 * Walk the DOM and collect text content that is NOT inside an <input> or <textarea>.
 * This lets us assert that a message was rolled back from the conversation transcript
 * even if the implementation restores the text to the input element.
 */
function getConversationText(): string {
  const inputEls = new Set<Element>(Array.from(document.querySelectorAll('input, textarea')));
  const parts: string[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    let ancestor: Element | null = node.parentElement;
    let insideInput = false;
    while (ancestor) {
      if (inputEls.has(ancestor)) { insideInput = true; break; }
      ancestor = ancestor.parentElement;
    }
    if (!insideInput) parts.push(node.textContent ?? '');
  }
  return parts.join('');
}

// ── Setup / teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  mockCreateOrGetJobConversation = jest.fn().mockResolvedValue({
    conversationId: CONV_ID,
    messages: [],
  });
  mockSendChatMessage = jest.fn().mockResolvedValue({
    reply: 'ok',
    conversationId: CONV_ID,
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ══════════════════════════════════════════════════════════════════════════════
// A. AUTH-EXPIRY ON LOAD — thrown Error
//
// Each trigger phrase must produce the EXACT auth-expiry message and NO Retry.
// Tests cover case-insensitivity, substring matching, and all three trigger phrases.
// ══════════════════════════════════════════════════════════════════════════════

describe('A — AUTH-EXPIRY on LOAD (thrown Error)', () => {
  it('A-1: "session expired" (lowercase) → exact auth message, no Retry', async () => {
    mockCreateOrGetJobConversation.mockRejectedValue(new Error('session expired'));
    render(<JobChatSection matchId={MATCH_ID} />);

    // CONTRACT: EXACT text — getByText throws on any deviation, exposing wrong/partial message
    // FINDING if throw: impl shows different text or nothing at all
    await waitFor(() => expect(screen.getByText(AUTH_EXPIRY_MSG)).toBeInTheDocument(), { timeout: 5000 });

    // CONTRACT: no Retry for auth-expiry (user should re-authenticate, not retry)
    // FINDING if Retry present: impl shows Retry on auth errors
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it('A-2: "Session Expired" (mixed case) → auth message — case-insensitive', async () => {
    mockCreateOrGetJobConversation.mockRejectedValue(new Error('Session Expired'));
    render(<JobChatSection matchId={MATCH_ID} />);

    // FINDING if throws: impl's classifier is case-sensitive, misses mixed-case variants
    await waitFor(() => expect(screen.getByText(AUTH_EXPIRY_MSG)).toBeInTheDocument(), { timeout: 5000 });
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it('A-3: "SESSION HAS EXPIRED" (all caps) → auth message — tests "session has expired" phrase', async () => {
    mockCreateOrGetJobConversation.mockRejectedValue(new Error('SESSION HAS EXPIRED'));
    render(<JobChatSection matchId={MATCH_ID} />);

    // FINDING if throws: impl checks "session expired" but not "session has expired"
    await waitFor(() => expect(screen.getByText(AUTH_EXPIRY_MSG)).toBeInTheDocument(), { timeout: 5000 });
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it('A-4: "not authorized" (lowercase) → auth message — third trigger phrase', async () => {
    mockCreateOrGetJobConversation.mockRejectedValue(new Error('not authorized'));
    render(<JobChatSection matchId={MATCH_ID} />);

    // FINDING if throws: impl only checks session-expiry phrases, misses "not authorized"
    await waitFor(() => expect(screen.getByText(AUTH_EXPIRY_MSG)).toBeInTheDocument(), { timeout: 5000 });
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it('A-5: "Request failed: Not Authorized" (substring match) → auth message', async () => {
    mockCreateOrGetJobConversation.mockRejectedValue(new Error('Request failed: Not Authorized'));
    render(<JobChatSection matchId={MATCH_ID} />);

    // FINDING if throws: impl requires exact equality instead of substring contains
    await waitFor(() => expect(screen.getByText(AUTH_EXPIRY_MSG)).toBeInTheDocument(), { timeout: 5000 });
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it('A-6: trigger phrase embedded mid-sentence → auth message (substring, not full equality)', async () => {
    mockCreateOrGetJobConversation.mockRejectedValue(
      new Error('Error: your session expired, please refresh the page')
    );
    render(<JobChatSection matchId={MATCH_ID} />);

    // FINDING if throws: impl checks full string equality, not substring contains
    await waitFor(() => expect(screen.getByText(AUTH_EXPIRY_MSG)).toBeInTheDocument(), { timeout: 5000 });
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// A'. AUTH-EXPIRY ON LOAD — resolved {error} shape
//
// Both failure shapes must be handled. A bug may handle thrown errors but forget
// to classify the resolved {error} string through the same auth-expiry check.
// ══════════════════════════════════════════════════════════════════════════════

describe("A' — AUTH-EXPIRY on LOAD (resolved {error})", () => {
  it("A'-1: resolved {error: 'session expired'} → exact auth message, no Retry", async () => {
    mockCreateOrGetJobConversation.mockResolvedValue({ error: 'session expired' });
    render(<JobChatSection matchId={MATCH_ID} />);

    // FINDING if non-auth shown: impl handles thrown auth errors but skips {error} classification
    // FINDING if nothing shown: impl ignores resolved {error} shape entirely
    await waitFor(() => expect(screen.getByText(AUTH_EXPIRY_MSG)).toBeInTheDocument(), { timeout: 5000 });
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it("A'-2: resolved {error: 'Not Authorized'} → exact auth message, no Retry", async () => {
    mockCreateOrGetJobConversation.mockResolvedValue({ error: 'Not Authorized' });
    render(<JobChatSection matchId={MATCH_ID} />);

    // FINDING if non-auth: impl handles thrown "not authorized" but not resolved {error: "Not Authorized"}
    await waitFor(() => expect(screen.getByText(AUTH_EXPIRY_MSG)).toBeInTheDocument(), { timeout: 5000 });
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it("A'-3: resolved {error: 'Session Expired'} (mixed case) → auth message, no Retry", async () => {
    mockCreateOrGetJobConversation.mockResolvedValue({ error: 'Session Expired' });
    render(<JobChatSection matchId={MATCH_ID} />);

    await waitFor(() => expect(screen.getByText(AUTH_EXPIRY_MSG)).toBeInTheDocument(), { timeout: 5000 });
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it("A'-4: resolved {error: 'session has expired'} → auth message, no Retry", async () => {
    mockCreateOrGetJobConversation.mockResolvedValue({ error: 'session has expired' });
    render(<JobChatSection matchId={MATCH_ID} />);

    await waitFor(() => expect(screen.getByText(AUTH_EXPIRY_MSG)).toBeInTheDocument(), { timeout: 5000 });
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// B. NON-AUTH LOAD FAILURE — both shapes
//
// Non-auth errors must NOT show the auth message. They must show Retry.
// Bug this catches: all errors collapsed to auth-expiry; Retry absent for non-auth.
// ══════════════════════════════════════════════════════════════════════════════

describe('B — NON-AUTH LOAD failure (thrown Error)', () => {
  it('B-1: non-auth thrown error → NOT auth message, Retry present', async () => {
    mockCreateOrGetJobConversation.mockRejectedValue(new Error('Network failure'));
    render(<JobChatSection matchId={MATCH_ID} />);
    await act(async () => {});
    await act(async () => {});

    // CONTRACT: must NOT show auth-expiry
    // FINDING if auth message shown: impl over-classifies all errors as auth-expiry
    expect(screen.queryByText(AUTH_EXPIRY_MSG)).not.toBeInTheDocument();

    // CONTRACT: Retry button present for recoverable errors
    // FINDING if absent: impl does not offer recovery path for non-auth load failures
    await waitFor(
      () => expect(screen.queryByRole('button', { name: /retry/i })).toBeInTheDocument(),
      { timeout: 5000 }
    );
  });

  it('B-2: non-auth thrown error → shows error message or fallback "Failed to load conversation."', async () => {
    const ERR = 'Service temporarily unavailable';
    mockCreateOrGetJobConversation.mockRejectedValue(new Error(ERR));
    render(<JobChatSection matchId={MATCH_ID} />);
    await act(async () => {});
    await act(async () => {});

    // CONTRACT: either the actual error message or the specified fallback is shown
    // FINDING if neither: impl swallows the error silently
    await waitFor(() => {
      const body = document.body.textContent ?? '';
      const shows = body.includes(ERR) || body.includes('Failed to load conversation');
      expect(shows).toBe(true);
    }, { timeout: 5000 });
  });
});

describe('B — NON-AUTH LOAD failure (resolved {error})', () => {
  it('B-3: resolved {error: non-auth} → NOT auth message, Retry present', async () => {
    mockCreateOrGetJobConversation.mockResolvedValue({ error: 'Conversation not found' });
    render(<JobChatSection matchId={MATCH_ID} />);
    await act(async () => {});
    await act(async () => {});

    // FINDING if auth message shown: impl treats ALL {error} responses as auth-expiry
    expect(screen.queryByText(AUTH_EXPIRY_MSG)).not.toBeInTheDocument();

    await waitFor(
      () => expect(screen.queryByRole('button', { name: /retry/i })).toBeInTheDocument(),
      { timeout: 5000 }
    );
  });

  it('B-4: resolved {error: non-auth} → shows error text or fallback', async () => {
    const ERR = 'Database connection failed';
    mockCreateOrGetJobConversation.mockResolvedValue({ error: ERR });
    render(<JobChatSection matchId={MATCH_ID} />);
    await act(async () => {});
    await act(async () => {});

    // FINDING if false: impl does not surface the error text from a resolved {error} response
    await waitFor(() => {
      const body = document.body.textContent ?? '';
      const shows = body.includes(ERR) || body.includes('Failed to load conversation');
      expect(shows).toBe(true);
    }, { timeout: 5000 });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// C. AUTH-EXPIRY ON SEND — both shapes, plus optimistic rollback
//
// Load succeeds → user sends a message → sendChatMessage fails with auth error.
// CONTRACT:
//   - Exact auth-expiry message shown
//   - NO Retry button
//   - Optimistic user message rolled back from conversation transcript
// ══════════════════════════════════════════════════════════════════════════════

describe('C — AUTH-EXPIRY on SEND (thrown Error)', () => {
  it('C-1: sendChatMessage throws "session expired" → auth message, no Retry', async () => {
    mockSendChatMessage.mockRejectedValue(new Error('session expired'));
    await renderLoaded();

    const input = findMessageInput();
    expect(input).not.toBeNull();
    fireEvent.change(input!, { target: { value: 'test send message' } });

    const sendBtn = findSendButton();
    expect(sendBtn).not.toBeNull();
    await act(async () => { fireEvent.click(sendBtn!); });
    await waitFor(() => expect(mockSendChatMessage).toHaveBeenCalled(), { timeout: 3000 });

    // FINDING if not shown: impl does not classify sendChatMessage auth errors
    await waitFor(() => expect(screen.getByText(AUTH_EXPIRY_MSG)).toBeInTheDocument(), { timeout: 5000 });

    // FINDING if Retry shown: impl shows Retry for auth errors on send — user should re-authenticate
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it('C-2: sendChatMessage throws "Not Authorized" → auth message, no Retry', async () => {
    mockSendChatMessage.mockRejectedValue(new Error('Not Authorized'));
    await renderLoaded();

    const input = findMessageInput();
    expect(input).not.toBeNull();
    fireEvent.change(input!, { target: { value: 'send-auth-test' } });

    const sendBtn = findSendButton();
    expect(sendBtn).not.toBeNull();
    await act(async () => { fireEvent.click(sendBtn!); });
    await waitFor(() => expect(mockSendChatMessage).toHaveBeenCalled(), { timeout: 3000 });

    await waitFor(() => expect(screen.getByText(AUTH_EXPIRY_MSG)).toBeInTheDocument(), { timeout: 5000 });
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it('C-3: optimistic message rolled back from transcript after auth error on send (thrown)', async () => {
    const SENTINEL = 'ROLLBACK-AUTH-THROW-TQX-SENTINEL';
    mockSendChatMessage.mockRejectedValue(new Error('session expired'));
    await renderLoaded();

    const input = findMessageInput();
    expect(input).not.toBeNull();
    fireEvent.change(input!, { target: { value: SENTINEL } });

    const sendBtn = findSendButton();
    expect(sendBtn).not.toBeNull();
    await act(async () => { fireEvent.click(sendBtn!); });
    await waitFor(() => expect(mockSendChatMessage).toHaveBeenCalled(), { timeout: 3000 });

    // Wait for the auth error to appear
    await waitFor(() => expect(screen.getByText(AUTH_EXPIRY_MSG)).toBeInTheDocument(), { timeout: 5000 });
    await act(async () => {});

    // CONTRACT: the optimistic message bubble must be removed from the conversation
    // getConversationText() excludes text inside <input>/<textarea>, so a restored-to-input
    // sentinel would NOT appear here — only a leaked conversation bubble would.
    // FINDING if SENTINEL present: impl did not roll back the optimistic message on auth error
    const convText = getConversationText();
    expect(convText).not.toContain(SENTINEL);
  });
});

describe('C — AUTH-EXPIRY on SEND (resolved {error})', () => {
  it("C'-1: sendChatMessage resolves {error: 'session expired'} → auth message, no Retry", async () => {
    mockSendChatMessage.mockResolvedValue({ error: 'session expired' });
    await renderLoaded();

    const input = findMessageInput();
    expect(input).not.toBeNull();
    fireEvent.change(input!, { target: { value: 'test' } });

    const sendBtn = findSendButton();
    expect(sendBtn).not.toBeNull();
    await act(async () => { fireEvent.click(sendBtn!); });
    await waitFor(() => expect(mockSendChatMessage).toHaveBeenCalled(), { timeout: 3000 });

    // FINDING if non-auth: impl handles thrown auth send errors but not resolved {error} auth
    await waitFor(() => expect(screen.getByText(AUTH_EXPIRY_MSG)).toBeInTheDocument(), { timeout: 5000 });
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it("C'-2: sendChatMessage resolves {error: 'Not Authorized'} → auth message, no Retry", async () => {
    mockSendChatMessage.mockResolvedValue({ error: 'Not Authorized' });
    await renderLoaded();

    const input = findMessageInput();
    expect(input).not.toBeNull();
    fireEvent.change(input!, { target: { value: 'test-resolved-auth' } });

    const sendBtn = findSendButton();
    expect(sendBtn).not.toBeNull();
    await act(async () => { fireEvent.click(sendBtn!); });
    await waitFor(() => expect(mockSendChatMessage).toHaveBeenCalled(), { timeout: 3000 });

    await waitFor(() => expect(screen.getByText(AUTH_EXPIRY_MSG)).toBeInTheDocument(), { timeout: 5000 });
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it("C'-3: optimistic message rolled back from transcript after auth error on send (resolved {error})", async () => {
    const SENTINEL = 'ROLLBACK-AUTH-RESOLVED-TQX-SENTINEL';
    mockSendChatMessage.mockResolvedValue({ error: 'session expired' });
    await renderLoaded();

    const input = findMessageInput();
    expect(input).not.toBeNull();
    fireEvent.change(input!, { target: { value: SENTINEL } });

    const sendBtn = findSendButton();
    expect(sendBtn).not.toBeNull();
    await act(async () => { fireEvent.click(sendBtn!); });
    await waitFor(() => expect(mockSendChatMessage).toHaveBeenCalled(), { timeout: 3000 });

    await waitFor(() => expect(screen.getByText(AUTH_EXPIRY_MSG)).toBeInTheDocument(), { timeout: 5000 });
    await act(async () => {});

    // FINDING if SENTINEL present: optimistic message not rolled back for resolved {error} auth shape
    const convText = getConversationText();
    expect(convText).not.toContain(SENTINEL);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// D. NON-AUTH SEND FAILURE — both shapes, rollback
//
// CONTRACT:
//   - NOT the auth-expiry message
//   - Retry button present
//   - Optimistic user message rolled back from transcript
//
// Bug this catches: all send errors treated as auth; Retry absent; no rollback.
// ══════════════════════════════════════════════════════════════════════════════

describe('D — NON-AUTH SEND failure', () => {
  it('D-1: sendChatMessage throws non-auth error → Retry present, NOT auth message', async () => {
    mockSendChatMessage.mockRejectedValue(new Error('Service unavailable'));
    await renderLoaded();

    const input = findMessageInput();
    expect(input).not.toBeNull();
    fireEvent.change(input!, { target: { value: 'send-error-test' } });

    const sendBtn = findSendButton();
    expect(sendBtn).not.toBeNull();
    await act(async () => { fireEvent.click(sendBtn!); });
    await waitFor(() => expect(mockSendChatMessage).toHaveBeenCalled(), { timeout: 3000 });
    await act(async () => {});

    // FINDING if auth message shown: impl over-classifies all send failures as auth-expiry
    expect(screen.queryByText(AUTH_EXPIRY_MSG)).not.toBeInTheDocument();

    // FINDING if Retry absent: impl does not offer retry for non-auth send failures
    await waitFor(
      () => expect(screen.queryByRole('button', { name: /retry/i })).toBeInTheDocument(),
      { timeout: 5000 }
    );
  });

  it('D-2: sendChatMessage resolves {error: non-auth} → Retry present, NOT auth message', async () => {
    mockSendChatMessage.mockResolvedValue({ error: 'Rate limit exceeded' });
    await renderLoaded();

    const input = findMessageInput();
    expect(input).not.toBeNull();
    fireEvent.change(input!, { target: { value: 'rate-limit-test' } });

    const sendBtn = findSendButton();
    expect(sendBtn).not.toBeNull();
    await act(async () => { fireEvent.click(sendBtn!); });
    await waitFor(() => expect(mockSendChatMessage).toHaveBeenCalled(), { timeout: 3000 });
    await act(async () => {});

    expect(screen.queryByText(AUTH_EXPIRY_MSG)).not.toBeInTheDocument();

    // FINDING if absent: impl ignores resolved {error} shape for retry UI on send
    await waitFor(
      () => expect(screen.queryByRole('button', { name: /retry/i })).toBeInTheDocument(),
      { timeout: 5000 }
    );
  });

  it('D-3: non-auth send error → optimistic message rolled back (thrown)', async () => {
    const SENTINEL = 'ROLLBACK-NONAUTH-THROW-TQX-SENTINEL';
    mockSendChatMessage.mockRejectedValue(new Error('Quota exceeded'));
    await renderLoaded();

    const input = findMessageInput();
    expect(input).not.toBeNull();
    fireEvent.change(input!, { target: { value: SENTINEL } });

    const sendBtn = findSendButton();
    expect(sendBtn).not.toBeNull();
    await act(async () => { fireEvent.click(sendBtn!); });
    await waitFor(() => expect(mockSendChatMessage).toHaveBeenCalled(), { timeout: 3000 });
    await act(async () => {});

    // CONTRACT: optimistic message must not remain in the conversation transcript
    // FINDING if SENTINEL in convText: impl leaves the optimistic bubble on non-auth send error
    const convText = getConversationText();
    expect(convText).not.toContain(SENTINEL);
  });

  it('D-4: non-auth send error → optimistic message rolled back (resolved {error})', async () => {
    const SENTINEL = 'ROLLBACK-NONAUTH-RESOLVED-TQX-SENTINEL';
    mockSendChatMessage.mockResolvedValue({ error: 'Server error' });
    await renderLoaded();

    const input = findMessageInput();
    expect(input).not.toBeNull();
    fireEvent.change(input!, { target: { value: SENTINEL } });

    const sendBtn = findSendButton();
    expect(sendBtn).not.toBeNull();
    await act(async () => { fireEvent.click(sendBtn!); });
    await waitFor(() => expect(mockSendChatMessage).toHaveBeenCalled(), { timeout: 3000 });
    await act(async () => {});

    // FINDING if SENTINEL in convText: impl handles thrown-error rollback but not resolved {error}
    const convText = getConversationText();
    expect(convText).not.toContain(SENTINEL);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// E. BOUNDARY / NEGATIVE — guard against auth-classifier over-matching
//
// Benign messages that contain "session", "expired", "unauthorized" (or similar
// near-matches) but do NOT contain the specific trigger phrases must NOT be
// classified as auth-expiry. They must show a normal error WITH Retry.
//
// Bug this catches: classifier uses /session/ or /expired/ instead of the precise
//   "session expired", "session has expired", "not authorized" substrings.
// ══════════════════════════════════════════════════════════════════════════════

describe('E — BOUNDARY: benign messages must NOT trigger auth-expiry', () => {
  const nonAuthBoundary: Array<{ id: string; desc: string; msg: string }> = [
    {
      id: 'E-1',
      desc: '"The session for this job could not be found" — has "session" but not "session expired"',
      msg: 'The session for this job could not be found',
    },
    {
      id: 'E-2',
      desc: '"expired listing" — has "expired" but not "session expired"',
      msg: 'expired listing',
    },
    {
      id: 'E-3',
      desc: '"This listing has expired" — has "expired" but not "session [has] expired"',
      msg: 'This listing has expired',
    },
    {
      id: 'E-4',
      desc: '"unauthorized access" — has "unauthorized" but NOT "not authorized" as substring',
      msg: 'unauthorized access',
    },
    {
      id: 'E-5',
      desc: '"Authorization failed" — auth-related but no trigger phrase',
      msg: 'Authorization failed',
    },
    {
      id: 'E-6',
      desc: '"session could not be created" — has "session" but no trigger phrase',
      msg: 'session could not be created',
    },
  ];

  for (const { id, desc, msg } of nonAuthBoundary) {
    it(`${id}: ${desc}`, async () => {
      mockCreateOrGetJobConversation.mockRejectedValue(new Error(msg));
      render(<JobChatSection matchId={MATCH_ID} />);
      await act(async () => {});
      await act(async () => {});

      // CONTRACT: must NOT show the auth-expiry message
      // FINDING if auth message shown: impl's classifier is too broad — false-positive auth
      expect(screen.queryByText(AUTH_EXPIRY_MSG)).not.toBeInTheDocument();

      // CONTRACT: Retry must be present — this is a recoverable non-auth error
      // FINDING if Retry absent: impl classified this as auth-expiry and suppressed Retry
      await waitFor(
        () => expect(screen.queryByRole('button', { name: /retry/i })).toBeInTheDocument(),
        { timeout: 5000 }
      );
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// F. EXISTING 78n INVARIANTS — must not be regressed by tqx changes
//
// The session-expiry feature should not break the basic chat behavior.
// ══════════════════════════════════════════════════════════════════════════════

describe('F — EXISTING 78n INVARIANTS (regression guard)', () => {
  it('F-1: no LLM call (sendChatMessage) on mount', async () => {
    await renderAndSettle();

    // FINDING if called: tqx changes introduced a side-effect that triggers sendChatMessage on open
    expect(mockSendChatMessage).not.toHaveBeenCalled();
  });

  it('F-2: prior messages from a successful load are rendered in the conversation', async () => {
    mockCreateOrGetJobConversation.mockResolvedValue({
      conversationId: CONV_ID,
      messages: [
        { role: 'user',      content: 'PRIOR-USER-TQX-SENTINEL' },
        { role: 'assistant', content: 'PRIOR-ASSISTANT-TQX-SENTINEL' },
      ],
    });
    await renderAndSettle();

    // FINDING if absent: session-expiry changes broke message rendering on load
    expect(document.body.textContent).toContain('PRIOR-USER-TQX-SENTINEL');
    expect(document.body.textContent).toContain('PRIOR-ASSISTANT-TQX-SENTINEL');
  });

  it('F-3: successful send appends the assistant reply to the conversation', async () => {
    const UNIQUE_REPLY = 'ASSISTANT-REPLY-TQX-SUCCESS-SENTINEL';
    mockSendChatMessage.mockResolvedValue({ reply: UNIQUE_REPLY, conversationId: CONV_ID });
    await renderLoaded();

    const input = findMessageInput();
    expect(input).not.toBeNull();
    fireEvent.change(input!, { target: { value: 'hello there' } });

    const sendBtn = findSendButton();
    expect(sendBtn).not.toBeNull();
    await act(async () => { fireEvent.click(sendBtn!); });

    // FINDING if absent: tqx error-handling changes broke successful-send reply rendering
    await waitFor(
      () => expect(document.body.textContent).toContain(UNIQUE_REPLY),
      { timeout: 5000 }
    );
  });

  it('F-4: happy path — no error state shown after a successful load', async () => {
    await renderLoaded();

    // FINDING if auth message or error shown: tqx changes cause false-positive error on success
    expect(screen.queryByText(AUTH_EXPIRY_MSG)).not.toBeInTheDocument();
    expect(document.querySelector('[role="alert"]')).not.toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// DISCLOSURE
//
// FILES READ (permitted by adversarial-author rules):
//   src/__tests__/78n.jobchat.smoke.test.tsx
//     — Mock skeleton (apiClient, Chakra, react-icons/fi), helper shape
//       (renderAndSettle waits for spinner, findSendButton aria-label pattern)
//   src/__tests__/78n.jobchat.adversarial.test.tsx
//     — Comprehensive Chakra UI mock (makeEl proxy, Input with value/onChange,
//       Alert with role="alert", IconButton with disabled forwarding)
//     — apiClient mock with no-op stubs for other methods
//     — nullIconProxy, act()/waitFor() patterns, getConversationText concept
//   src/__tests__/tqx.JobChatSection.smoke.test.tsx
//     — Confirmed AUTH_EXPIRY_MSG = "Your session has expired. Please log in again."
//       (this string is from the task contract; the smoke test independently confirmed it)
//     — Confirmed the component uses role="status" for its loading spinner
//     — screen.getByText(/no messages yet/i) observed but NOT encoded in any assertion
//       (irrelevant to session-expiry contract)
//
// FILES NOT OPENED (forbidden):
//   src/components/Dashboard/JobChatSection.tsx  ✓ NOT opened
//
// INCIDENTAL DISCLOSURES:
//   From tqx.JobChatSection.smoke.test.tsx (permitted read):
//   - AUTH_EXPIRY_MSG: this string appears in the task spec/contract and was confirmed,
//     not derived from, the implementation.
//   - Named export { JobChatSection }: confirmed contract; no internal logic inferred.
//   - screen.getByText(/no messages yet/i): reveals an empty-state UI string. HOW AVOIDED:
//     no test asserts on this string — tests focus on error paths and message rendering.
//
// UNTESTABLE-WITHOUT-READING (findings):
//   1. Optimistic rollback internals: getConversationText() uses a DOM walker to exclude
//      <input>/<textarea> text. If the component renders message bubbles inside elements
//      that the walker cannot distinguish from inputs (e.g. a contenteditable div), the
//      rollback assertion would be a false pass. This is a testability defect.
//   2. Auth classifier code path: cannot verify which specific code path performs
//      classification (load vs send, thrown vs resolved) without reading the impl body.
//      Tests cover the observable contract but cannot verify internal branch coverage.
//   3. "Dismiss error" button for non-auth send: contract mentions a "Dismiss error"
//      button. Tests verify Retry presence but do not independently assert "Dismiss error"
//      is a separate button — both could be the same button.
// ══════════════════════════════════════════════════════════════════════════════
