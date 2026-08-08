/**
 * Smoke tests for onlyjobs-78n: JobChatSection per-job AI chat.
 *
 * Oracle: onlyjobs-78n spec —
 *   - Mount calls createOrGetJobConversation(matchId), NOT sendChatMessage (no LLM on open)
 *   - Prior messages from the conversation response are rendered
 *   - Typing + Send calls sendChatMessage(text, conversationId) and renders the reply
 *   - Only message text (not job data) is sent in the sendChatMessage call
 *
 * DISCLOSURE — files read while writing:
 *   - JobChatSection.tsx: prop interface { matchId }, state init, handleSend signature.
 *   - apiClient.ts: createOrGetJobConversation and sendChatMessage signatures.
 * No assertions encode implementation internals.
 */

// ─── Mock control variables ────────────────────────────────────────────────────
let mockCreateOrGetJobConversation: jest.Mock;
let mockSendChatMessage: jest.Mock;

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("@/lib/apiClient", () => ({
  __esModule: true,
  createApiClient: () => ({
    createOrGetJobConversation: (...args: any[]) =>
      mockCreateOrGetJobConversation(...args),
    sendChatMessage: (...args: any[]) => mockSendChatMessage(...args),
  }),
}));

jest.mock("react-icons/fi", () => ({
  FiSend: () => null,
  FiX: () => null,
}));

// Chakra UI — same comprehensive mock as other smoke tests
jest.mock("@chakra-ui/react", () => {
  const React = require("react");
  const cache: Record<string, any> = {};
  const makeEl = (tag: string) => {
    if (cache[tag]) return cache[tag];
    const C = React.forwardRef(
      (
        {
          children,
          onClick,
          type,
          disabled,
          isDisabled,
          "aria-label": al,
          href,
          role,
          onChange,
          onKeyDown,
          value,
          placeholder,
          dangerouslySetInnerHTML,
          ...rest
        }: any,
        ref: any
      ) =>
        // eslint-disable-next-line react/no-danger-with-children
        React.createElement(
          tag,
          {
            ref,
            onClick,
            type,
            disabled: disabled || isDisabled,
            "aria-label": al,
            href,
            role,
            onChange,
            onKeyDown,
            value,
            placeholder,
            dangerouslySetInnerHTML,
          },
          dangerouslySetInnerHTML ? undefined : children
        )
    );
    C.displayName = tag;
    cache[tag] = C;
    return C;
  };
  const known: Record<string, any> = {
    __esModule: true,
    ChakraProvider: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
    Box: makeEl("div"),
    Flex: makeEl("div"),
    VStack: makeEl("div"),
    HStack: makeEl("div"),
    Text: makeEl("span"),
    Heading: makeEl("h3"),
    Button: ({ children, onClick, isDisabled, disabled, size, variant, colorScheme, ...rest }: any) =>
      React.createElement(
        "button",
        { onClick, disabled: isDisabled || disabled },
        children
      ),
    IconButton: ({ "aria-label": al, onClick, isDisabled, disabled, children }: any) =>
      React.createElement(
        "button",
        { "aria-label": al, onClick, disabled: isDisabled || disabled },
        children ?? null
      ),
    Input: ({ onChange, onKeyDown, value, placeholder, isDisabled, disabled }: any) =>
      React.createElement("input", {
        onChange,
        onKeyDown,
        value,
        placeholder,
        disabled: isDisabled || disabled,
        "data-testid": "chat-input",
      }),
    Divider: () => React.createElement("hr"),
    Spinner: () =>
      React.createElement("div", { role: "status", "aria-label": "Loading" }),
    Alert: makeEl("div"),
    AlertIcon: () => null,
    AlertTitle: makeEl("span"),
    AlertDescription: makeEl("span"),
    useColorModeValue: (light: any) => light,
    useDisclosure: () => {
      const [isOpen, setIsOpen] = React.useState(false);
      return {
        isOpen,
        onOpen: () => setIsOpen(true),
        onClose: () => setIsOpen(false),
      };
    },
    useToast: () => jest.fn(),
    useBreakpointValue: (vals: any) => {
      if (vals && typeof vals === "object") {
        return vals.base ?? vals.sm ?? vals.md ?? Object.values(vals)[0];
      }
      return vals;
    },
    extendTheme: (t: any) => t,
  };
  return new Proxy(known, {
    get(target, prop) {
      if (prop in target) return Reflect.get(target, prop);
      if (typeof prop === "string") {
        if (prop.startsWith("use")) {
          if (!cache[`hook:${prop}`]) cache[`hook:${prop}`] = () => ({});
          return cache[`hook:${prop}`];
        }
        return makeEl("div");
      }
      return Reflect.get(target, prop);
    },
  });
});

// ─── Imports (after jest.mock declarations) ────────────────────────────────────

import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { JobChatSection } from "@/components/Dashboard/JobChatSection";

// ─── Setup ────────────────────────────────────────────────────────────────────

const MATCH_ID = "match-abc-123";
const CONV_ID = "conv-xyz-456";

beforeEach(() => {
  mockCreateOrGetJobConversation = jest.fn().mockResolvedValue({
    conversationId: CONV_ID,
    messages: [],
  });
  mockSendChatMessage = jest.fn().mockResolvedValue({
    reply: "Assistant reply",
    conversationId: CONV_ID,
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ══════════════════════════════════════════════════════════════════════════════
// 1. Mount calls createOrGetJobConversation — NOT sendChatMessage (no LLM on open)
// ══════════════════════════════════════════════════════════════════════════════

describe("1 — no LLM call on mount", () => {
  it("calls createOrGetJobConversation with matchId on mount", async () => {
    render(<JobChatSection matchId={MATCH_ID} />);

    await waitFor(() =>
      expect(mockCreateOrGetJobConversation).toHaveBeenCalledWith(MATCH_ID)
    );
  });

  it("does NOT call sendChatMessage on mount", async () => {
    render(<JobChatSection matchId={MATCH_ID} />);

    await waitFor(() =>
      expect(mockCreateOrGetJobConversation).toHaveBeenCalled()
    );

    expect(mockSendChatMessage).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. Prior messages are rendered after mount
// ══════════════════════════════════════════════════════════════════════════════

describe("2 — prior messages rendered from conversation", () => {
  it("renders user and assistant messages from the prior conversation", async () => {
    mockCreateOrGetJobConversation.mockResolvedValue({
      conversationId: CONV_ID,
      messages: [
        { role: "user", content: "Am I a good fit?" },
        { role: "assistant", content: "Yes, you are a strong match." },
      ],
    });

    render(<JobChatSection matchId={MATCH_ID} />);

    await screen.findByText("Am I a good fit?");
    expect(screen.getByText("Yes, you are a strong match.")).toBeInTheDocument();
    expect(mockSendChatMessage).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Sending a message calls sendChatMessage with only text + conversationId
// ══════════════════════════════════════════════════════════════════════════════

describe("3 — send calls sendChatMessage with only text + conversationId", () => {
  it("calls sendChatMessage(text, conversationId) and renders the reply", async () => {
    render(<JobChatSection matchId={MATCH_ID} />);

    await waitFor(() =>
      expect(mockCreateOrGetJobConversation).toHaveBeenCalledWith(MATCH_ID)
    );

    const input = screen.getByTestId("chat-input");
    fireEvent.change(input, { target: { value: "How can I improve?" } });

    const sendBtn = screen.getByRole("button", { name: "Send message" });
    await act(async () => {
      fireEvent.click(sendBtn);
    });

    await waitFor(() =>
      expect(mockSendChatMessage).toHaveBeenCalledWith("How can I improve?", CONV_ID)
    );

    // The call must NOT include job data — only text and conversationId
    const [sentText, sentConvId, ...extra] = mockSendChatMessage.mock.calls[0];
    expect(sentText).toBe("How can I improve?");
    expect(sentConvId).toBe(CONV_ID);
    expect(extra).toHaveLength(0);

    await screen.findByText("Assistant reply");
  });

  it("renders the user message optimistically before the reply arrives", async () => {
    let resolveReply!: (v: any) => void;
    mockSendChatMessage.mockReturnValue(
      new Promise((res) => {
        resolveReply = res;
      })
    );

    render(<JobChatSection matchId={MATCH_ID} />);

    await waitFor(() =>
      expect(mockCreateOrGetJobConversation).toHaveBeenCalled()
    );

    const input = screen.getByTestId("chat-input");
    fireEvent.change(input, { target: { value: "Tell me more" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    });

    // User message appears immediately (optimistic)
    expect(screen.getByText("Tell me more")).toBeInTheDocument();

    // Resolve the pending reply
    await act(async () => {
      resolveReply({ reply: "Here is more detail", conversationId: CONV_ID });
    });

    await screen.findByText("Here is more detail");
  });
});
