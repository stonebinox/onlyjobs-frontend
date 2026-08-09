/**
 * Smoke test for onlyjobs-tqx: JobChatSection mounts and renders.
 *
 * Oracle: component renders loading state, then message list on success.
 * Auth-error path: SESSION_EXPIRED_MSG shown, no Retry button.
 * Non-auth error path: generic message shown, Retry button present.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

let mockCreateOrGetJobConversation: jest.Mock;
let mockSendChatMessage: jest.Mock;

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

jest.mock("@chakra-ui/react", () => {
  const React = require("react");
  const cache: Record<string, any> = {};
  const makeEl = (tag: string) => {
    if (cache[tag]) return cache[tag];
    const C = React.forwardRef(
      ({ children, onClick, disabled, "aria-label": al, ...rest }: any, ref: any) =>
        React.createElement(tag, { ref, onClick, disabled, "aria-label": al }, children)
    );
    C.displayName = tag;
    cache[tag] = C;
    return C;
  };
  const known: Record<string, any> = {
    __esModule: true,
    Box: makeEl("div"),
    VStack: makeEl("div"),
    HStack: makeEl("div"),
    Text: makeEl("span"),
    Button: makeEl("button"),
    IconButton: ({ "aria-label": al, onClick, children }: any) =>
      React.createElement("button", { "aria-label": al, onClick }, children ?? null),
    Input: makeEl("input"),
    Divider: () => React.createElement("hr"),
    Spinner: () => React.createElement("div", { role: "status", "aria-label": "Loading" }),
    Alert: makeEl("div"),
    AlertIcon: () => null,
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

// ─── Imports ──────────────────────────────────────────────────────────────────

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { JobChatSection } from "@/components/Dashboard/JobChatSection";

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockCreateOrGetJobConversation = jest.fn();
  mockSendChatMessage = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("JobChatSection smoke", () => {
  it("shows loading spinner on mount", () => {
    mockCreateOrGetJobConversation.mockReturnValue(new Promise(() => {})); // never resolves
    render(<JobChatSection matchId="match-1" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders empty message list on successful load", async () => {
    mockCreateOrGetJobConversation.mockResolvedValue({
      conversationId: "conv-1",
      messages: [],
    });
    render(<JobChatSection matchId="match-1" />);
    await waitFor(() =>
      expect(screen.queryByRole("status")).not.toBeInTheDocument()
    );
    expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
  });

  it("shows auth-expiry message and NO Retry on 401-style load error", async () => {
    mockCreateOrGetJobConversation.mockRejectedValue(
      new Error("Session expired. Please log in again.")
    );
    render(<JobChatSection matchId="match-1" />);
    await waitFor(() =>
      expect(
        screen.getByText("Your session has expired. Please log in again.")
      ).toBeInTheDocument()
    );
    expect(screen.queryByRole("button", { name: /retry/i })).not.toBeInTheDocument();
  });

  it("shows generic error and Retry button on non-auth load error", async () => {
    mockCreateOrGetJobConversation.mockRejectedValue(new Error("Network error"));
    render(<JobChatSection matchId="match-1" />);
    await waitFor(() =>
      expect(screen.getByText("Network error")).toBeInTheDocument()
    );
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });
});
