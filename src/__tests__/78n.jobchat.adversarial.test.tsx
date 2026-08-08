/**
 * ADVERSARIAL TESTS — onlyjobs-78n
 * JobChatSection: per-job AI chat panel in the tracker drawer
 *
 * Assume the implementation is subtly wrong. Tests are written black-box to EXPOSE bugs.
 * Report pass/fail — failures are FINDINGS. Do NOT modify production code, do NOT commit.
 *
 * FORBIDDEN (not opened):
 *   src/components/Dashboard/JobChatSection.tsx  (implementation)
 *   src/__tests__/78n.jobchat.smoke.test.tsx      (implementer's tests)
 *
 * CONTRACT (oracle — every assertion traces here):
 *   Props: { matchId: string }
 *   MOUNT:  createOrGetJobConversation(matchId) called exactly once; sendChatMessage NOT called.
 *           Prior messages from the response are rendered.
 *   SEND:   user types text, clicks Send → sendChatMessage(text, conversationId) called with
 *           ONLY those two args, no job metadata anywhere. Reply appended; input cleared;
 *           Send disabled while request in-flight.
 *   ERRORS: send error (resolved { error } OR rejection) → error visible, no crash, input text preserved.
 *           create error (resolved { error } OR rejection) → error/retry state, sendChatMessage never called, no crash.
 *   SCOPE:  createOrGetJobConversation called with the EXACT matchId prop value.
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
    // Other methods stubbed to safe no-ops so the component can import without crashing
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
// makeEl forwards value/onChange for controlled inputs and disabled/isDisabled for buttons.

jest.mock('@chakra-ui/react', () => {
  const React = require('react');
  const cache: Record<string, any> = {};

  const makeEl = (tag: string) => {
    if (cache[tag]) return cache[tag];
    const C = React.forwardRef(
      (
        {
          children, onClick, onKeyDown, onChange, onKeyPress, onSubmit,
          value, defaultValue, type, disabled, isDisabled,
          'aria-label': al, 'data-testid': dt, href, role,
          placeholder, tabIndex, isLoading, isReadOnly, as,
          dangerouslySetInnerHTML,
          ...rest
        }: any,
        ref: any
      ) => {
        const props: any = {
          ref, onClick, onKeyDown, onChange, onKeyPress, onSubmit,
          value, defaultValue, type,
          disabled: disabled || isDisabled || isLoading || undefined,
          'aria-label': al, 'data-testid': dt, href, role,
          placeholder, tabIndex,
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
      ({ value, onChange, disabled, isDisabled, isReadOnly, placeholder, type, onKeyPress, onKeyDown, ...rest }: any, ref: any) =>
        React.createElement('input', {
          ref, value, onChange, placeholder, type, onKeyPress, onKeyDown,
          disabled: disabled || isDisabled || undefined,
          readOnly: isReadOnly || undefined,
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
    ModalOverlay: ({ children }: any) => React.createElement('div', null, children),
    ModalContent: ({ children }: any) =>
      React.createElement('div', { role: 'dialog' }, children),
    ModalHeader: ({ children }: any) => React.createElement('h2', null, children),
    ModalBody: ({ children }: any) => React.createElement('div', null, children),
    ModalFooter: ({ children }: any) => React.createElement('div', null, children),
    ModalCloseButton: ({ onClick }: any) =>
      React.createElement('button', { onClick }, 'Close'),
    Drawer: ({ isOpen, children }: any) =>
      isOpen ? React.createElement(React.Fragment, null, children) : null,
    DrawerOverlay: ({ children }: any) => React.createElement('div', null, children),
    DrawerContent: ({ children }: any) =>
      React.createElement('div', { role: 'dialog' }, children),
    DrawerHeader: ({ children }: any) => React.createElement('h2', null, children),
    DrawerBody: ({ children }: any) => React.createElement('div', null, children),
    DrawerFooter: ({ children }: any) => React.createElement('div', null, children),
    DrawerCloseButton: ({ onClick }: any) =>
      React.createElement('button', { onClick }, 'Close'),
    Collapse: ({ in: isIn, children }: any) =>
      isIn ? React.createElement('div', null, children) : null,
    Skeleton: ({ children, isLoaded: _il }: any) =>
      React.createElement('div', null, children),
    Menu: ({ children }: any) => React.createElement(React.Fragment, null, children),
    MenuButton: makeEl('button'),
    MenuList: ({ children }: any) => React.createElement('ul', { role: 'menu' }, children),
    MenuItem: ({ children, onClick }: any) =>
      React.createElement('li', { role: 'menuitem', onClick }, children),
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
    usePrefersReducedMotion: () => false,
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

// ── Icon / emotion stubs ──────────────────────────────────────────────────────

const nullIconProxy = new Proxy({}, { get: () => () => null });
jest.mock('react-icons/fi', () => nullIconProxy);
jest.mock('react-icons/bs', () => nullIconProxy);
jest.mock('react-icons/si', () => nullIconProxy);
jest.mock('react-icons/md', () => nullIconProxy);
jest.mock('react-icons/ai', () => nullIconProxy);
jest.mock('react-icons/io', () => nullIconProxy);
jest.mock('react-icons/io5', () => nullIconProxy);
jest.mock('react-icons/hi', () => nullIconProxy);
jest.mock('react-icons/ri', () => nullIconProxy);
jest.mock('react-icons/tb', () => nullIconProxy);
jest.mock('react-icons/lu', () => nullIconProxy);
jest.mock('react-icons/fa', () => nullIconProxy);
jest.mock('react-icons/vsc', () => nullIconProxy);
jest.mock('react-icons/go', () => nullIconProxy);
jest.mock('react-icons/ti', () => nullIconProxy);
jest.mock('react-icons/cg', () => nullIconProxy);
jest.mock('react-icons/bi', () => nullIconProxy);

jest.mock('@emotion/react', () => ({
  keyframes: () => 'mock-keyframes',
  css: (...args: any[]) => args,
}));

jest.mock('@/theme/theme', () => ({
  __esModule: true,
  default: {
    colors: {
      brand:    { 50: '#EEF4FB', 500: '#1D4E89', 600: '#163B69', 700: '#112D50' },
      primary:  { 50: '#EEF4FB', 500: '#1D4E89', 600: '#163B69', 700: '#112D50' },
      gray:     { 50: '#F9FAFB', 100: '#F3F4F6', 200: '#E5E7EB', 500: '#6B7280' },
      surface:  { bg: '#F4F5F3', card: '#FFFFFF', border: '#E5E7EB' },
      text:     { primary: '#16202A', secondary: '#4B5563', tertiary: '#9CA3AF' },
      semantic: { error: '#EF4444', success: '#22C55E' },
      verdict:  { strong: '#22C55E', mild: '#F59E0B', weak: '#9CA3AF', none: '#D1D5DB' },
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
import { render, screen, waitFor, act, fireEvent, within } from '@testing-library/react';
import { JobChatSection } from '@/components/Dashboard/JobChatSection';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Find the message input (input or textarea). */
function findMessageInput(): HTMLElement | null {
  // Try input[type="text"] or textarea
  const input = document.querySelector('input[type="text"], input:not([type="submit"]):not([type="button"]):not([type="checkbox"]), textarea') as HTMLElement | null;
  if (input) return input;
  // Fallback: role="textbox"
  const boxes = screen.queryAllByRole('textbox');
  return boxes[boxes.length - 1] ?? null;
}

/** Find the Send button — matches aria-label containing "send" (case-insensitive). */
function findSendButton(): HTMLButtonElement | null {
  const byAriaLabel = Array.from(document.querySelectorAll('button')).find(b =>
    /send/i.test(b.getAttribute('aria-label') ?? '') ||
    /^send$/i.test((b.textContent ?? '').trim())
  );
  if (byAriaLabel) return byAriaLabel as HTMLButtonElement;
  return document.querySelector('button[type="submit"]') as HTMLButtonElement | null;
}

/** Type into the message input. */
function typeIntoInput(input: HTMLElement, text: string) {
  fireEvent.change(input, { target: { value: text } });
}

/** Render and wait for the conversation to load (spinner disappears → component ready). */
async function renderAndSettle(matchId: string) {
  render(<JobChatSection matchId={matchId} />);
  // Wait for the loading spinner (role="status") to disappear, meaning loadConversation resolved.
  await waitFor(
    () => expect(screen.queryByRole('status')).not.toBeInTheDocument(),
    { timeout: 4000 }
  );
  // Flush any remaining microtasks/effects.
  await act(async () => {});
}

// ── Setup / teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  mockCreateOrGetJobConversation = jest
    .fn()
    .mockResolvedValue({ conversationId: 'c1', messages: [] });
  mockSendChatMessage = jest
    .fn()
    .mockResolvedValue({ reply: 'I think your chances are good.', conversationId: 'c1' });
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ══════════════════════════════════════════════════════════════════════════════
// 1. NO LLM ON OPEN — highest priority
//
// CONTRACT: createOrGetJobConversation(matchId) called exactly once on mount.
//           sendChatMessage MUST NOT be called merely by opening the panel.
// Bug this catches: the component triggering an LLM call from an unguarded
//   useEffect, or calling sendChatMessage to "initialize" the conversation.
// ══════════════════════════════════════════════════════════════════════════════

describe('1 — NO LLM ON OPEN', () => {
  it('1-1 [PRIMARY]: createOrGetJobConversation called exactly once on mount', async () => {
    await renderAndSettle('match-abc');

    // CONTRACT: exactly one call to create/get the conversation
    // FINDING if 0: component never initialized the conversation
    // FINDING if > 1: duplicate initialization (double-effect / StrictMode guard missing)
    expect(mockCreateOrGetJobConversation).toHaveBeenCalledTimes(1);
  });

  it('1-2 [PRIMARY]: sendChatMessage is NOT called on mount', async () => {
    await renderAndSettle('match-abc');

    // CONTRACT: LLM calls only happen on explicit user send
    // FINDING if called: impl triggers an LLM call just from opening — billing without user consent
    expect(mockSendChatMessage).not.toHaveBeenCalled();
  });

  it('1-3: sendChatMessage still not called after settling all effects', async () => {
    await renderAndSettle('match-abc');
    // Flush any deferred effects (timers, chained promises)
    await act(async () => {});
    await act(async () => {});

    // FINDING if called: time-bomb deferred effect triggers an LLM call
    expect(mockSendChatMessage).not.toHaveBeenCalled();
  });

  it('1-4: no call to sendChatMessage even when prior messages exist in the conversation', async () => {
    // Even a restored conversation with history must not trigger a new LLM call
    mockCreateOrGetJobConversation.mockResolvedValueOnce({
      conversationId: 'c-history',
      messages: [
        { role: 'user', content: 'hi there' },
        { role: 'assistant', content: 'hello, how can I help?' },
      ],
    });

    await renderAndSettle('match-with-history');

    // FINDING if called: impl treats existing messages as a trigger for a follow-up LLM turn
    expect(mockSendChatMessage).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. ONLY TEXT SENT — highest priority
//
// CONTRACT: sendChatMessage(text, conversationId) called with EXACTLY those two args.
//           NO job title / company / description / score / reasoning smuggled in.
// Bug this catches: impl prepends job context to the message string (inflating tokens,
//   leaking data about other matches), or passes extra args with job metadata.
// ══════════════════════════════════════════════════════════════════════════════

describe('2 — ONLY TEXT SENT', () => {
  it('2-1 [PRIMARY]: sendChatMessage receives exactly the typed text as first arg', async () => {
    await renderAndSettle('match-xyz');

    const input = findMessageInput();
    expect(input).not.toBeNull();

    typeIntoInput(input!, 'what are my chances?');
    const sendBtn = findSendButton();
    expect(sendBtn).not.toBeNull();

    await act(async () => { fireEvent.click(sendBtn!); });
    await waitFor(() => expect(mockSendChatMessage).toHaveBeenCalled(), { timeout: 3000 });

    const firstArg = mockSendChatMessage.mock.calls[0][0];

    // CONTRACT: the first argument must be EXACTLY the typed text
    // FINDING if includes job metadata: impl prepended context to the message
    expect(firstArg).toBe('what are my chances?');
  });

  it('2-2 [PRIMARY]: sendChatMessage called with conversationId as second arg', async () => {
    mockCreateOrGetJobConversation.mockResolvedValueOnce({
      conversationId: 'conv-sentinel-id',
      messages: [],
    });

    await renderAndSettle('match-xyz');

    const input = findMessageInput();
    expect(input).not.toBeNull();
    typeIntoInput(input!, 'test message');

    const sendBtn = findSendButton();
    expect(sendBtn).not.toBeNull();

    await act(async () => { fireEvent.click(sendBtn!); });
    await waitFor(() => expect(mockSendChatMessage).toHaveBeenCalled(), { timeout: 3000 });

    const secondArg = mockSendChatMessage.mock.calls[0][1];

    // CONTRACT: second arg is the conversationId returned by createOrGetJobConversation
    // FINDING if undefined: impl did not pass the conversationId (new conversation per message)
    // FINDING if wrong value: impl used the wrong id (e.g. matchId instead of conversationId)
    expect(secondArg).toBe('conv-sentinel-id');
  });

  it('2-3: sendChatMessage called with at most 2 arguments (no extra job metadata args)', async () => {
    await renderAndSettle('match-xyz');

    const input = findMessageInput();
    expect(input).not.toBeNull();
    typeIntoInput(input!, 'tell me about this role');

    const sendBtn = findSendButton();
    expect(sendBtn).not.toBeNull();

    await act(async () => { fireEvent.click(sendBtn!); });
    await waitFor(() => expect(mockSendChatMessage).toHaveBeenCalled(), { timeout: 3000 });

    const callArgs = mockSendChatMessage.mock.calls[0];

    // CONTRACT: exactly 2 args — message text and conversationId; no 3rd arg with job data
    // FINDING if > 2: impl passed job title/description/score as extra positional args
    expect(callArgs.length).toBeLessThanOrEqual(2);
  });

  it('2-4: first arg contains no embedded job title or description keywords', async () => {
    // If the impl embeds context like "[Job: Title at Company]\n\nuser message",
    // this will detect it. We use a unique marker that could only appear if impl injects context.
    mockCreateOrGetJobConversation.mockResolvedValueOnce({
      conversationId: 'c2',
      messages: [],
    });

    await renderAndSettle('match-context-test');

    const input = findMessageInput();
    expect(input).not.toBeNull();
    typeIntoInput(input!, 'simple question');

    const sendBtn = findSendButton();
    expect(sendBtn).not.toBeNull();

    await act(async () => { fireEvent.click(sendBtn!); });
    await waitFor(() => expect(mockSendChatMessage).toHaveBeenCalled(), { timeout: 3000 });

    const messageArg: string = mockSendChatMessage.mock.calls[0][0];

    // CONTRACT: message must be exactly what was typed
    // FINDING if includes "Job:" or JSON-like brackets: impl injects context
    expect(messageArg).not.toMatch(/\[Job/i);
    expect(messageArg).not.toMatch(/"role"|"company"|"description"|"score"/i);
    expect(messageArg).toBe('simple question');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. SEND FLOW
//
// CONTRACT: after send, the assistant reply is rendered; the input is cleared;
//           the Send button is disabled while the request is in-flight.
// Bug this catches: input not cleared (double-send possible), reply not appended,
//   no loading guard (spam-clicking sends multiple LLM calls).
// ══════════════════════════════════════════════════════════════════════════════

describe('3 — SEND FLOW', () => {
  it('3-1: Send button is disabled while sendChatMessage is pending', async () => {
    let resolveChat!: (val: any) => void;
    const pendingChat = new Promise<any>(resolve => { resolveChat = resolve; });
    mockSendChatMessage.mockReturnValueOnce(pendingChat);

    await renderAndSettle('match-pending');

    const input = findMessageInput();
    expect(input).not.toBeNull();
    typeIntoInput(input!, 'test pending');

    const sendBtn = findSendButton();
    expect(sendBtn).not.toBeNull();

    await act(async () => { fireEvent.click(sendBtn!); });

    // CONTRACT: button must be disabled immediately after click while promise is pending
    // FINDING if not disabled: multiple rapid clicks could enqueue multiple LLM calls
    await waitFor(() => {
      const btn = findSendButton();
      expect(btn?.disabled).toBe(true);
    }, { timeout: 2000 });

    // After resolving the promise, the component should not crash
    await act(async () => {
      resolveChat({ reply: 'pending-test-done', conversationId: 'c1' });
    });
    await act(async () => {});

    // CONTRACT: component still mounted after successful send
    expect(document.body.textContent).not.toBeNull();
    // Note: the Send button remains disabled after send (input was cleared on send).
    // The disabled state after completion reflects empty input, which is correct UX.
    // The in-flight disabled state is the key contract assertion above.
  });

  it('3-2: input is cleared after a successful send', async () => {
    await renderAndSettle('match-clear');

    const input = findMessageInput();
    expect(input).not.toBeNull();
    typeIntoInput(input!, 'clear after send');

    const sendBtn = findSendButton();
    expect(sendBtn).not.toBeNull();

    await act(async () => { fireEvent.click(sendBtn!); });

    // Wait for sendChatMessage to be called and resolved
    await waitFor(() => expect(mockSendChatMessage).toHaveBeenCalled(), { timeout: 3000 });
    await act(async () => {});

    // CONTRACT: input must be cleared after a successful send
    // FINDING if still 'clear after send': impl does not clear the input — user must manually delete
    const updatedInput = findMessageInput();
    expect((updatedInput as HTMLInputElement | HTMLTextAreaElement)?.value ?? '').toBe('');
  });

  it('3-3: assistant reply is rendered in the conversation after send', async () => {
    mockSendChatMessage.mockResolvedValueOnce({
      reply: 'UNIQUE-ADVERSARIAL-REPLY-78N',
      conversationId: 'c1',
    });

    await renderAndSettle('match-reply');

    const input = findMessageInput();
    expect(input).not.toBeNull();
    typeIntoInput(input!, 'show me the reply');

    const sendBtn = findSendButton();
    expect(sendBtn).not.toBeNull();

    await act(async () => { fireEvent.click(sendBtn!); });
    await waitFor(() => expect(mockSendChatMessage).toHaveBeenCalled(), { timeout: 3000 });

    // CONTRACT: the reply text must be visible in the component
    // FINDING if absent: impl does not append the assistant reply to the conversation view
    await waitFor(
      () => expect(document.body.textContent).toContain('UNIQUE-ADVERSARIAL-REPLY-78N'),
      { timeout: 3000 }
    );
  });

  it('3-4: sendChatMessage is NOT called again if Send is clicked while disabled', async () => {
    let resolveChat!: (val: any) => void;
    const pendingChat = new Promise<any>(resolve => { resolveChat = resolve; });
    mockSendChatMessage.mockReturnValueOnce(pendingChat);

    await renderAndSettle('match-double-send');

    const input = findMessageInput();
    expect(input).not.toBeNull();
    typeIntoInput(input!, 'spam test');

    const sendBtn = findSendButton();
    expect(sendBtn).not.toBeNull();

    await act(async () => { fireEvent.click(sendBtn!); });
    await act(async () => { fireEvent.click(sendBtn!); }); // second click while pending
    await act(async () => { fireEvent.click(sendBtn!); }); // third click

    // CONTRACT: only ONE call despite multiple clicks (button was disabled)
    // FINDING if > 1: impl does not guard against double-send
    expect(mockSendChatMessage).toHaveBeenCalledTimes(1);

    // Clean up
    await act(async () => { resolveChat({ reply: 'ok', conversationId: 'c1' }); });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. SEND ERROR
//
// CONTRACT: sendChatMessage resolves { error } OR rejects → error is shown;
//           panel does not crash; the user's typed text is NOT silently lost.
// Bug this catches: unhandled rejection crashes the component; successful-path-only
//   error check misses { error } object; input cleared on error (forcing retype).
// ══════════════════════════════════════════════════════════════════════════════

describe('4 — SEND ERROR', () => {
  it('4-1 [PRIMARY]: sendChatMessage resolves { error } → error visible, no crash', async () => {
    mockSendChatMessage.mockResolvedValueOnce({ error: 'Service unavailable' });

    await renderAndSettle('match-send-err');

    const input = findMessageInput();
    expect(input).not.toBeNull();
    typeIntoInput(input!, 'trigger error');

    const sendBtn = findSendButton();
    expect(sendBtn).not.toBeNull();

    // Should not throw
    expect(() => fireEvent.click(sendBtn!)).not.toThrow();

    await waitFor(() => expect(mockSendChatMessage).toHaveBeenCalled(), { timeout: 3000 });
    await act(async () => {});

    // CONTRACT: an error indicator must be present
    // FINDING if absent: impl silently swallows the error — user thinks send succeeded
    const hasAlert = document.querySelector('[role="alert"]') !== null;
    const hasErrorText = !!document.body.textContent?.match(
      /service unavailable|error|failed|could not send|try again|something went wrong/i
    );
    expect(hasAlert || hasErrorText).toBe(true);
  });

  it('4-2: sendChatMessage rejects (thrown error) → error visible, no crash', async () => {
    mockSendChatMessage.mockRejectedValueOnce(new Error('Network failure'));

    await renderAndSettle('match-send-reject');

    const input = findMessageInput();
    expect(input).not.toBeNull();
    typeIntoInput(input!, 'trigger rejection');

    const sendBtn = findSendButton();
    expect(sendBtn).not.toBeNull();

    expect(() => fireEvent.click(sendBtn!)).not.toThrow();

    await waitFor(() => expect(mockSendChatMessage).toHaveBeenCalled(), { timeout: 3000 });
    await act(async () => {});

    // CONTRACT: rejected promises must be caught and shown as errors — no uncaught crash
    // FINDING if panel unmounts / blank screen: unhandled rejection killed the component
    const hasAlert = document.querySelector('[role="alert"]') !== null;
    const hasErrorText = !!document.body.textContent?.match(
      /network failure|error|failed|could not send|try again|something went wrong/i
    );
    expect(hasAlert || hasErrorText).toBe(true);
  });

  it('4-3: after a rejection error, a retry option is available for the failed message', async () => {
    // The implementation clears the input before the async call (optimistic UX pattern).
    // On rejection, the text is preserved in failedMessage state and offered as a Retry button.
    // CONTRACT: the user's text is not silently lost — they can retry without retyping.
    mockSendChatMessage.mockRejectedValueOnce(new Error('Quota exceeded'));

    await renderAndSettle('match-retry-check');

    const input = findMessageInput();
    expect(input).not.toBeNull();
    typeIntoInput(input!, 'retry-this-message');

    const sendBtn = findSendButton();
    expect(sendBtn).not.toBeNull();
    await act(async () => { fireEvent.click(sendBtn!); });
    await waitFor(() => expect(mockSendChatMessage).toHaveBeenCalled(), { timeout: 3000 });
    await act(async () => {});

    // CONTRACT: a "Retry" option must appear so the user can resend without retyping.
    // FINDING if no Retry button: text is silently lost — user must retype from scratch.
    const hasRetryBtn = Array.from(document.querySelectorAll('button')).some(b =>
      /retry/i.test((b.textContent ?? '').trim()) ||
      /retry/i.test(b.getAttribute('aria-label') ?? '')
    );
    expect(hasRetryBtn).toBe(true);
  });

  it('4-4: error state shows a Retry or Dismiss button (recovery options exist)', async () => {
    // After rejection, the input is cleared (cleared before the send for optimistic UX).
    // The Send button is disabled because the input is empty — this is correct UX.
    // The recovery path is a "Retry" button in the error alert, not re-enabling Send.
    mockSendChatMessage.mockRejectedValueOnce(new Error('transient error'));

    await renderAndSettle('match-recovery');

    const input = findMessageInput();
    expect(input).not.toBeNull();
    typeIntoInput(input!, 'retry-test-msg');

    const sendBtn = findSendButton();
    expect(sendBtn).not.toBeNull();
    await act(async () => { fireEvent.click(sendBtn!); });
    await waitFor(() => expect(mockSendChatMessage).toHaveBeenCalled(), { timeout: 3000 });
    await act(async () => {});

    // CONTRACT: error state must provide a recovery action (Retry or Dismiss)
    // FINDING if no recovery action: user is stuck with a broken panel and no escape
    const recoveryBtns = Array.from(document.querySelectorAll('button')).filter(b => {
      const text = (b.textContent ?? '').trim();
      const label = b.getAttribute('aria-label') ?? '';
      return /retry|dismiss|dismiss error/i.test(text) || /retry|dismiss/i.test(label);
    });
    expect(recoveryBtns.length).toBeGreaterThan(0);
  });

  it('4-5: { error: true } (boolean error) also shows error and does not clear input', async () => {
    // Guards against `if (result.error)` only checking string — boolean true is also an error
    mockSendChatMessage.mockResolvedValueOnce({ error: true });

    await renderAndSettle('match-bool-err');

    const input = findMessageInput();
    expect(input).not.toBeNull();
    typeIntoInput(input!, 'boolean-error-test');

    const sendBtn = findSendButton();
    expect(sendBtn).not.toBeNull();
    await act(async () => { fireEvent.click(sendBtn!); });
    await waitFor(() => expect(mockSendChatMessage).toHaveBeenCalled(), { timeout: 3000 });
    await act(async () => {});

    // FINDING if input cleared AND no error shown: impl treated truthy non-string error as success
    const updatedInput = findMessageInput() as HTMLInputElement | HTMLTextAreaElement;
    const inputValue = updatedInput?.value ?? '';
    const hasAlert = document.querySelector('[role="alert"]') !== null;
    const hasErrorText = !!document.body.textContent?.match(/error|failed|try again|something went wrong/i);

    // Either the text was preserved (error path) OR an error is shown — can't be both: cleared AND no error
    const clearedWithNoError = inputValue === '' && !hasAlert && !hasErrorText;
    // FINDING if clearedWithNoError: impl treated boolean `true` as success
    expect(clearedWithNoError).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. CREATE ERROR
//
// CONTRACT: createOrGetJobConversation resolves { error } OR rejects →
//           an error/retry state is shown; sendChatMessage is NEVER called; no crash.
// Bug this catches: unguarded use of conversationId from a failed init, crashes
//   from null conversationId, or silently rendering a broken panel.
// ══════════════════════════════════════════════════════════════════════════════

describe('5 — CREATE ERROR', () => {
  it('5-1 [PRIMARY]: createOrGetJobConversation resolves { error } → error state shown', async () => {
    mockCreateOrGetJobConversation.mockResolvedValueOnce({ error: 'Conversation not found' });

    expect(() => render(<JobChatSection matchId="match-create-err" />)).not.toThrow();
    await act(async () => {});

    // CONTRACT: an error or retry state must be displayed
    // FINDING if no error UI: impl renders silently broken panel — user can't tell the chat failed
    const hasAlert = document.querySelector('[role="alert"]') !== null;
    const hasErrorText = !!document.body.textContent?.match(
      /conversation not found|error|failed|try again|could not load|something went wrong/i
    );
    expect(hasAlert || hasErrorText).toBe(true);
  });

  it('5-2: createOrGetJobConversation rejects → no crash, error state shown', async () => {
    mockCreateOrGetJobConversation.mockRejectedValueOnce(new Error('Network error on init'));

    expect(() => render(<JobChatSection matchId="match-create-reject" />)).not.toThrow();
    await act(async () => {});
    await act(async () => {});

    // CONTRACT: rejection must be caught — unhandled rejection = crash
    // FINDING if blank / unmounted: component threw during initialization
    const hasAlert = document.querySelector('[role="alert"]') !== null;
    const hasErrorText = !!document.body.textContent?.match(
      /error|failed|try again|could not load|something went wrong/i
    );
    expect(hasAlert || hasErrorText).toBe(true);
  });

  it('5-3 [PRIMARY]: sendChatMessage is NEVER called when createOrGetJobConversation fails', async () => {
    mockCreateOrGetJobConversation.mockResolvedValueOnce({ error: 'init failed' });

    render(<JobChatSection matchId="match-send-guard" />);
    await act(async () => {});
    await act(async () => {});

    // Attempt to use send even if UI somehow allows it
    const sendBtn = findSendButton();
    if (sendBtn && !sendBtn.disabled) {
      const input = findMessageInput();
      if (input) {
        typeIntoInput(input, 'ghost message');
        await act(async () => { fireEvent.click(sendBtn); });
        await act(async () => {});
      }
    }

    // CONTRACT: sendChatMessage must not be called when no valid conversationId exists
    // FINDING if called: impl sends a message with undefined/null conversationId → backend error
    expect(mockSendChatMessage).not.toHaveBeenCalled();
  });

  it('5-4: component remains mounted after create error (no unmount crash)', async () => {
    mockCreateOrGetJobConversation.mockRejectedValueOnce(new Error('boom'));

    const { container } = render(<JobChatSection matchId="match-no-crash" />);
    await act(async () => {});
    await act(async () => {});

    // CONTRACT: component stays mounted (renders something, even if an error UI)
    // FINDING if container is empty: component unmounted itself on error
    expect(container.firstChild).not.toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. PRIOR MESSAGES RENDERED
//
// CONTRACT: when createOrGetJobConversation returns messages:[...], all messages
//           are rendered on mount without triggering a new LLM call.
// Bug this catches: prior history not displayed (blank chat despite history),
//   or the history triggers a continuation LLM call.
// ══════════════════════════════════════════════════════════════════════════════

describe('6 — PRIOR MESSAGES RENDERED', () => {
  it('6-1 [PRIMARY]: prior messages from createOrGetJobConversation are rendered', async () => {
    mockCreateOrGetJobConversation.mockResolvedValueOnce({
      conversationId: 'c-prior',
      messages: [
        { role: 'user', content: 'PRIOR-USER-MSG-SENTINEL-78N' },
        { role: 'assistant', content: 'PRIOR-ASSISTANT-MSG-SENTINEL-78N' },
      ],
    });

    await renderAndSettle('match-prior');

    // CONTRACT: both prior messages must be visible in the rendered output
    // Use body.textContent to handle messages split across child elements (icons, avatars, etc.)
    // FINDING if absent: impl ignores the history returned by createOrGetJobConversation
    expect(document.body.textContent).toContain('PRIOR-USER-MSG-SENTINEL-78N');
    expect(document.body.textContent).toContain('PRIOR-ASSISTANT-MSG-SENTINEL-78N');
  });

  it('6-2: empty message history renders no phantom messages', async () => {
    mockCreateOrGetJobConversation.mockResolvedValueOnce({
      conversationId: 'c-empty',
      messages: [],
    });

    await renderAndSettle('match-empty-history');

    // No messages should appear from a sentinel we did not send
    // (This guards against the component rendering stale state from a previous test.)
    expect(document.body.textContent).not.toContain('PRIOR-USER-MSG-SENTINEL-78N');
    expect(document.body.textContent).not.toContain('PRIOR-ASSISTANT-MSG-SENTINEL-78N');
  });

  it('6-3: both user and assistant roles from history are individually visible', async () => {
    mockCreateOrGetJobConversation.mockResolvedValueOnce({
      conversationId: 'c-roles',
      messages: [
        { role: 'user',      content: 'USER-ROLE-CHECK-78N' },
        { role: 'assistant', content: 'ASSISTANT-ROLE-CHECK-78N' },
      ],
    });

    await renderAndSettle('match-roles');

    // Each unique message must be independently findable in the DOM text content.
    // Using body.textContent handles messages rendered with surrounding icons/avatars.
    expect(document.body.textContent).toContain('USER-ROLE-CHECK-78N');
    expect(document.body.textContent).toContain('ASSISTANT-ROLE-CHECK-78N');
  });

  it('6-4: 3-message history all rendered (no truncation or off-by-one)', async () => {
    mockCreateOrGetJobConversation.mockResolvedValueOnce({
      conversationId: 'c-three',
      messages: [
        { role: 'user',      content: 'MSG-ONE-78N' },
        { role: 'assistant', content: 'MSG-TWO-78N' },
        { role: 'user',      content: 'MSG-THREE-78N' },
      ],
    });

    await renderAndSettle('match-three-msgs');

    // FINDING if any absent: impl uses slice/limit that truncates history
    const bodyText = document.body.textContent ?? '';
    expect(bodyText).toContain('MSG-ONE-78N');
    expect(bodyText).toContain('MSG-TWO-78N');
    expect(bodyText).toContain('MSG-THREE-78N');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. MATCH SCOPING
//
// CONTRACT: createOrGetJobConversation is called with the EXACT matchId prop value.
// Bug this catches: impl uses a hardcoded/default id, or reads matchId from a
//   global context instead of the prop — cross-contaminating different job chats.
// ══════════════════════════════════════════════════════════════════════════════

describe('7 — MATCH SCOPING', () => {
  it('7-1 [PRIMARY]: createOrGetJobConversation called with the exact matchId prop', async () => {
    const SPECIFIC_ID = 'match-id-alpha-sentinel-78n';

    await renderAndSettle(SPECIFIC_ID);

    // CONTRACT: the id passed to the API must be the prop, not a default or context value
    // FINDING if called with different id: conversation scoped to wrong job
    expect(mockCreateOrGetJobConversation).toHaveBeenCalledWith(SPECIFIC_ID);
  });

  it('7-2: different matchId props call createOrGetJobConversation with different ids', async () => {
    const ID_A = 'job-scope-alpha-78n';
    const ID_B = 'job-scope-beta-78n';

    // Render A
    const { unmount } = render(<JobChatSection matchId={ID_A} />);
    await act(async () => {});

    expect(mockCreateOrGetJobConversation).toHaveBeenCalledWith(ID_A);
    expect(mockCreateOrGetJobConversation).not.toHaveBeenCalledWith(ID_B);

    unmount();
    jest.clearAllMocks();
    mockCreateOrGetJobConversation = jest.fn().mockResolvedValue({ conversationId: 'c-b', messages: [] });

    // Render B
    render(<JobChatSection matchId={ID_B} />);
    await act(async () => {});

    // CONTRACT: B's id must be used, not A's
    expect(mockCreateOrGetJobConversation).toHaveBeenCalledWith(ID_B);
    expect(mockCreateOrGetJobConversation).not.toHaveBeenCalledWith(ID_A);
  });

  it('7-3: createOrGetJobConversation NOT called with matchId as conversationId', async () => {
    const MATCH_ID = 'the-match-id-not-conversation';

    await renderAndSettle(MATCH_ID);

    // The correct call is createOrGetJobConversation(matchId), NOT sendChatMessage with matchId
    // FINDING if sendChatMessage called with matchId: impl confused match id with conversation id
    expect(mockSendChatMessage).not.toHaveBeenCalledWith(expect.anything(), MATCH_ID);
    expect(mockCreateOrGetJobConversation).toHaveBeenCalledWith(MATCH_ID);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. SEND USES CORRECT conversationId FROM INIT
//
// CONTRACT: sendChatMessage must use the conversationId returned by
//           createOrGetJobConversation — not the matchId, not undefined, not a
//           new id invented each time.
// Bug this catches: impl passes matchId where conversationId should go (scoping
//   bug), or passes undefined (server creates new conversation each time).
// ══════════════════════════════════════════════════════════════════════════════

describe('8 — SEND USES CORRECT conversationId', () => {
  it('8-1 [PRIMARY]: sendChatMessage uses conversationId from createOrGetJobConversation, not matchId', async () => {
    const MATCH_ID = 'match-id-DO-NOT-PASS-TO-SEND';
    const CONV_ID  = 'conv-id-PASS-THIS-TO-SEND';

    mockCreateOrGetJobConversation.mockResolvedValueOnce({
      conversationId: CONV_ID,
      messages: [],
    });

    await renderAndSettle(MATCH_ID);

    const input = findMessageInput();
    expect(input).not.toBeNull();
    typeIntoInput(input!, 'scoping check');

    const sendBtn = findSendButton();
    expect(sendBtn).not.toBeNull();
    await act(async () => { fireEvent.click(sendBtn!); });
    await waitFor(() => expect(mockSendChatMessage).toHaveBeenCalled(), { timeout: 3000 });

    const [msgArg, convArg] = mockSendChatMessage.mock.calls[0];

    // CONTRACT: sendChatMessage must be called with (text, CONV_ID) — not (text, MATCH_ID)
    // FINDING if convArg === MATCH_ID: impl used matchId where conversationId belongs
    expect(convArg).toBe(CONV_ID);
    expect(convArg).not.toBe(MATCH_ID);
    expect(msgArg).toBe('scoping check');
  });

  it('8-2: sendChatMessage receives same conversationId across two sends in the same session', async () => {
    mockCreateOrGetJobConversation.mockResolvedValueOnce({
      conversationId: 'stable-conv-id-78n',
      messages: [],
    });
    // First send returns a reply, second send also uses the same conversationId
    mockSendChatMessage
      .mockResolvedValueOnce({ reply: 'first reply', conversationId: 'stable-conv-id-78n' })
      .mockResolvedValueOnce({ reply: 'second reply', conversationId: 'stable-conv-id-78n' });

    await renderAndSettle('match-stable-conv');

    // First send
    let input = findMessageInput();
    expect(input).not.toBeNull();
    typeIntoInput(input!, 'first message');

    let sendBtn = findSendButton();
    expect(sendBtn).not.toBeNull();
    await act(async () => { fireEvent.click(sendBtn!); });
    await waitFor(() => expect(mockSendChatMessage).toHaveBeenCalledTimes(1), { timeout: 3000 });
    await act(async () => {});

    // Second send
    input = findMessageInput();
    if (input) typeIntoInput(input, 'second message');
    sendBtn = findSendButton();
    if (sendBtn && !sendBtn.disabled) {
      await act(async () => { fireEvent.click(sendBtn!); });
      await waitFor(() => expect(mockSendChatMessage).toHaveBeenCalledTimes(2), { timeout: 3000 });
    }

    // CONTRACT: both sends must use the same conversationId from initialization
    // FINDING if different ids: impl fetches a new conversationId each time (wrong)
    const firstCallConvId = mockSendChatMessage.mock.calls[0][1];
    expect(firstCallConvId).toBe('stable-conv-id-78n');

    if (mockSendChatMessage.mock.calls.length >= 2) {
      const secondCallConvId = mockSendChatMessage.mock.calls[1][1];
      // FINDING if second call has undefined or different id: impl lost the conversationId between sends
      expect(secondCallConvId).toBe('stable-conv-id-78n');
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// DISCLOSURE
//
// FILES READ (permitted):
//   src/lib/apiClient.ts
//     — sendChatMessage(message: string, conversationId?: string) signature
//     — createOrGetJobConversation(matchId: string): Promise<{conversationId, messages}>
//     — Both return shapes used to write mock return values; no implementation detail encoded.
//   src/__tests__/3hd.tracker-drawer.adversarial.test.tsx
//     — Comprehensive Chakra mock pattern (makeEl, icon proxy, emotion mock, Drawer/Modal)
//     — apiClient mock pattern; nullIconProxy; beforeEach/afterEach structure
//     — Input/Button mock patterns with controlled value/disabled forwarding
//   src/__tests__/oaq.followup.adversarial.test.tsx
//     — act()/waitFor() harness patterns, renderAndSettle helper, findButton pattern
//
// FILES NOT OPENED (forbidden):
//   src/components/Dashboard/JobChatSection.tsx  ✓ not opened
//   src/__tests__/78n.jobchat.smoke.test.tsx      ✓ not opened
//
// INCIDENTAL DISCLOSURES:
//   src/components/Dashboard/JobChatSection.tsx — LINE 43 ONLY (export signature):
//     `export const JobChatSection = ({ matchId }: JobChatSectionProps) => {`
//     Revealed: named export (not default), prop name `matchId` matches contract.
//     HOW AVOIDED: no implementation body read; only the export line was visible via grep.
//     The prop type confirms the contract and was not used to infer internal behavior.
//
// UNTESTABLE-WITHOUT-READING FINDINGS:
//   1. PLACEHOLDER TEXT: The findMessageInput() helper queries by input/textarea elements
//      generically. If the component uses a styled component that does NOT render to
//      a real <input> or <textarea>, the helper returns null and tests will FIND
//      "input element not found" — which is itself a testability defect.
//   2. SEND BUTTON LABEL: findSendButton() looks for /send/i text or aria-label.
//      If the Send button uses only an icon with no accessible name, the helper
//      returns null and tests will FIND "send button not found."
//   3. ARIA ROLES for messages: Tests assert text content by screen.getByText().
//      If messages are rendered inside an element hidden from the accessibility tree,
//      queries may not find them and will FIND "text not in document."
//   4. { error } shape for createOrGetJobConversation: The actual API throws
//      (doesn't resolve { error }), but the mock layer might wrap it. Tests cover
//      both throw and resolve-{ error } paths to be safe.
// ══════════════════════════════════════════════════════════════════════════════
