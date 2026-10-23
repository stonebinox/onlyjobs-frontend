/**
 * Smoke tests for onlyjobs-z5tx: rejection-signal toast + "Keep showing <company>"
 * on /browse (card skip and drawer No). Real page, AllJobsTab, JobListing and drawer;
 * only the API client is mocked.
 */
import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { ChakraProvider } from "@chakra-ui/react";
import type { RejectionSignalSummary } from "@/types/RejectionSignalSummary";

const api: Record<string, jest.Mock> = {};

jest.mock("@/lib/apiClient", () => ({
  createApiClient: () =>
    new Proxy(
      {},
      {
        get: (_t, prop: string) => {
          if (!api[prop]) api[prop] = jest.fn().mockResolvedValue({});
          return api[prop];
        },
      }
    ),
}));
jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ isReady: true, isLoggedIn: true }),
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) => (
    <a href={typeof href === "string" ? href : href?.pathname} {...rest}>
      {children}
    </a>
  ),
}));
jest.mock("@/components/Layout/DashboardLayout", () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));
jest.mock("@/components/SEO", () => ({ SEO: () => null }));
jest.mock("@/components/Dashboard/GenerateAnswer", () => ({ GenerateAnswer: () => null }));
jest.mock("@/components/Dashboard/JobChatSection", () => ({ JobChatSection: () => null }));
jest.mock("@/utils/analytics", () => ({ trackEvent: jest.fn() }));

import BrowsePage from "@/pages/browse";

const signal = (over: Partial<RejectionSignalSummary> = {}): RejectionSignalSummary => ({
  scope: "company",
  company: "Tether",
  duration: "temporary",
  blockedUntil: "2026-12-22T12:00:00Z",
  ...over,
});

const click = (el: Element) =>
  act(async () => {
    fireEvent.click(el);
  });

const setup = (opts: { skipRes?: any; appliedRes?: any; revokeRes?: any } = {}) => {
  for (const k of Object.keys(api)) delete api[k];
  const set = (name: string, value: any) => {
    api[name] = jest.fn().mockResolvedValue(value);
  };
  set("getUserProfile", {
    id: "u1",
    name: "N",
    email: "e@e.com",
    isVerified: true,
    resume: { skills: ["a"], experience: ["x"], summary: "s" },
  });
  set("checkWalletBalance", { balance: 10 });
  set("getAllJobs", {
    jobs: [
      {
        _id: "job1",
        title: "Role1",
        company: "Tether",
        location: ["Remote"],
        salary: { min: 100, max: 200, currency: "USD" },
        source: "t",
        description: "d",
        postedDate: "2026-01-01",
        url: "https://example.com/job1",
        match: {
          _id: "match1",
          matchScore: 90,
          verdict: "good",
          reasoning: "because",
          skipped: false,
          applied: null,
          updatedAt: "2026-01-01",
        },
      },
    ],
    pages: 1,
    total: 1,
    sources: [],
  });
  set("markMatchClick", {});
  set("markMatchAsSkipped", opts.skipRes ?? { message: "ok", signal: null });
  set("markMatchApplied", opts.appliedRes ?? { message: "ok", signal: null });
  set("revokeBlock", opts.revokeRes ?? { message: "ok", revoked: 1 });
  return render(
    <ChakraProvider>
      <BrowsePage />
    </ChakraProvider>
  );
};

const skipCard = async () => {
  await click(await screen.findByRole("button", { name: "Skip" }));
  await click(await screen.findByText("Salary too low"));
  await click(await screen.findByRole("button", { name: "Skip Job" }));
};

const answerNoInDrawer = async () => {
  await click(await screen.findByRole("button", { name: "Write Answer with AI" }));
  await click(await screen.findByRole("button", { name: "No" }));
  await click(await screen.findByText("Salary too low"));
  await click(await screen.findByRole("button", { name: "Submit" }));
};

beforeAll(() => {
  window.matchMedia =
    window.matchMedia ||
    ((q: string) =>
      ({
        matches: false,
        media: q,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        onchange: null,
        dispatchEvent: jest.fn(),
      } as any));
});

describe("z5tx Browse rejection signals", () => {
  test("card skip with a temporary company signal shows the hiding toast; Keep showing revokes that matchId", async () => {
    setup({ skipRes: { message: "ok", signal: signal() } });
    await screen.findByText("Role1");
    await skipCard();

    expect(await screen.findByText("Hiding Tether until 22 Dec.")).toBeInTheDocument();
    await click(await screen.findByRole("button", { name: "Keep showing Tether" }));

    await waitFor(() => expect(api.revokeBlock).toHaveBeenCalledWith("match1"));
    expect(api.revokeBlock).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("OK - Tether will keep showing up.")).toBeInTheDocument();
  });

  test("drawer No with a signal shows the hiding toast", async () => {
    setup({ appliedRes: { message: "ok", signal: signal() } });
    await screen.findByText("Role1");
    await answerNoInDrawer();

    expect(await screen.findByText("Hiding Tether until 22 Dec.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Keep showing Tether" })).toBeInTheDocument();
    expect(screen.queryByText("Undo")).toBeNull();
  });

  test("null signal shows no Hiding toast on either path", async () => {
    const { unmount } = setup();
    await screen.findByText("Role1");
    await skipCard();
    await waitFor(() => expect(api.markMatchAsSkipped).toHaveBeenCalled());
    expect(screen.queryByText(/Hiding/)).toBeNull();
    expect(screen.queryByText(/Keep showing/)).toBeNull();
    unmount();

    setup();
    await screen.findByText("Role1");
    await answerNoInDrawer();
    await waitFor(() => expect(api.markMatchApplied).toHaveBeenCalled());
    expect(screen.queryByText(/Hiding/)).toBeNull();
    expect(screen.queryByText(/Keep showing/)).toBeNull();
  });
});
