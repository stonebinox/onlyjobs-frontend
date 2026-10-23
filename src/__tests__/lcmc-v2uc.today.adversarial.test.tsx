import React from "react";
import { render, screen, waitFor, fireEvent, act, within } from "@testing-library/react";
import { ChakraProvider } from "@chakra-ui/react";
import type { JobResult } from "@/types/JobResult";

// ---- mutable test state (names prefixed `mock` so jest.mock factories may close over them)
let mockView: string | null = null;
const mockApi: Record<string, jest.Mock> = {};
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock("@/lib/apiClient", () => ({
  createApiClient: () =>
    new Proxy(
      {},
      {
        get: (_t, prop: string) => {
          if (mockApi[prop]) return mockApi[prop];
          return async () => ({});
        },
      }
    ),
}));
jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ isReady: true, isLoggedIn: true }),
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => ({ get: (k: string) => (k === "view" ? mockView : null) }),
}));
jest.mock("next/link", () => {
  const L = ({ href, children, ...rest }: any) => (
    <a href={typeof href === "string" ? href : href?.pathname} {...rest}>{children}</a>
  );
  return { __esModule: true, default: L };
});
jest.mock("@/components/Layout/DashboardLayout", () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
  DashboardLayout: ({ children }: any) => <div>{children}</div>,
}));
jest.mock("@/components/SEO", () => ({ __esModule: true, default: () => null, SEO: () => null }));
jest.mock("@/components/Dashboard/OutOfCreditPreview", () => ({ __esModule: true, default: () => null, OutOfCreditPreview: () => null }));
jest.mock("@/components/Dashboard/ResumeRequiredBanner", () => ({ __esModule: true, default: () => null, ResumeRequiredBanner: () => null }));
jest.mock("@/components/Dashboard/LocationPromptBanner", () => ({ __esModule: true, default: () => null, LocationPromptBanner: () => null }));
jest.mock("@/components/Dashboard/GenerateAnswer", () => ({ __esModule: true, default: () => null, GenerateAnswer: () => null }));
jest.mock("@/components/Dashboard/JobChatSection", () => ({ __esModule: true, default: () => null, JobChatSection: () => null }));
jest.mock("@/utils/analytics", () => ({ trackEvent: jest.fn(), __esModule: true }));

import TodayPage from "@/pages/today";

// ---- fixtures
const mkJob = (i: string, extra: any = {}) => ({
  _id: `job-${i}`,
  title: `Role Title ${i}`,
  company: `Company Name ${i}`,
  location: ["Berlin"],
  salary: { min: 100000, max: 120000, currency: "USD", estimated: false },
  tags: [],
  source: "src",
  description: "desc",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  postedDate: "2026-01-01T00:00:00Z",
  scrapedDate: "2026-01-01T00:00:00Z",
  url: `https://example.com/jobs/${i}`,
  ...extra,
});
const pad = (n: number) => String(n).padStart(2, "0");
const mkMatch = (n: number, over: Partial<JobResult> = {}): JobResult => ({
  _id: `m-${pad(n)}`,
  userId: "u1",
  jobId: `job-${pad(n)}`,
  matchScore: 100 - n,
  verdict: "good",
  reasoning: "because",
  clicked: false,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  skipped: false,
  applied: null,
  job: mkJob(pad(n)) as any,
  ...over,
});
const eligible = (count: number) => Array.from({ length: count }, (_, i) => mkMatch(i));
const title = (n: number) => `Role Title ${pad(n)}`;
const company = (n: number) => `Company Name ${pad(n)}`;

const profile = {
  id: "u1", name: "T", email: "t@e.com", phone: null, currentLocation: "Berlin",
  resume: { skills: ["a"], experience: ["x"], education: [], certifications: [], languages: [], projects: [], achievements: [], volunteerExperience: [], interests: [], summary: "s" },
  preferences: null,
};

const setup = (opts: { matches?: any; visited?: any; skipped?: any; view?: string | null } = {}) => {
  mockView = opts.view ?? null;
  Object.keys(mockApi).forEach((k) => delete mockApi[k]);
  const defs: Record<string, any> = {
    getMatches: async () => opts.matches ?? [],
    getVisited: async () => opts.visited ?? [],
    getSkipped: async () => opts.skipped ?? [],
    checkWalletBalance: async () => ({ balance: 100 }),
    getUserProfile: async () => profile,
    getOutOfCreditPreview: async () => ({ error: "none" }),
    unskipMatch: async () => ({}),
    markMatchClick: async () => ({}),
    markMatchAsSkipped: async () => ({}),
    markMatchApplied: async () => ({}),
    createOrGetJobConversation: async () => ({ conversationId: "c1", messages: [] }),
  };
  for (const [k, v] of Object.entries(defs)) mockApi[k] = jest.fn(v);
  return render(
    <ChakraProvider>
      <TodayPage />
    </ChakraProvider>
  );
};

const waitForBrief = async () => {
  await waitFor(() => expect(screen.queryAllByRole("button", { name: "Not for me" }).length).toBeGreaterThan(0));
};
/** Flush pending promise continuations inside act() so "nothing happened" assertions run after all async work settled. */
const settle = () =>
  act(async () => {
    for (let i = 0; i < 20; i++) await Promise.resolve();
  });
/** Click inside an async act() so the handler's awaited state updates are flushed in-scope. */
const click = (el: Element) =>
  act(async () => {
    fireEvent.click(el);
  });
const cardCount = () => screen.queryAllByRole("button", { name: "Not for me", hidden: true }).length;
const bodyHas = (re: RegExp) => re.test((document.body.textContent || "").replace(/\s+/g, " "));
const has = (t: string) => screen.queryByText(t) !== null;

const setVisibility = (state: "visible" | "hidden") => {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
  Object.defineProperty(document, "hidden", { configurable: true, get: () => state === "hidden" });
};
const returnToTab = async () => {
  await act(async () => {
    setVisibility("hidden");
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await act(async () => {
    setVisibility("visible");
    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new Event("focus"));
  });
};

/** Click "Open listing" on the i-th visible card, then return to the tab so the sidebar prompt opens. */
const openSidebarFor = async (cardIdx = 0, expectedN?: number) => {
  const btns = screen.getAllByRole("button", { name: "Open listing" });
  await click(btns[cardIdx]);
  await waitFor(() => expect(mockApi.markMatchClick).toHaveBeenCalled());
  await returnToTab();
  await screen.findByText(/Did you apply to/);
  if (expectedN !== undefined) {
    expect(screen.getByText(new RegExp(`Did you apply to ${title(expectedN)} at ${company(expectedN)}`))).toBeInTheDocument();
  }
};

const skipViaCard = async (cardIdx: number) => {
  await click(screen.getAllByRole("button", { name: "Not for me" })[cardIdx]);
  await click(await screen.findByRole("button", { name: "Salary too low" }));
  await click(screen.getByRole("button", { name: "Skip this job" }));
};

beforeAll(() => {
  window.matchMedia =
    window.matchMedia ||
    (((q: string) => ({ matches: false, media: q, addEventListener: jest.fn(), removeEventListener: jest.fn(), addListener: jest.fn(), removeListener: jest.fn(), onchange: null, dispatchEvent: jest.fn() })) as any);
  (window as any).scrollTo = jest.fn();
});
beforeEach(() => {
  jest.clearAllMocks();
  setVisibility("visible");
  window.open = jest.fn(() => null) as any;
  window.sessionStorage.clear();
  window.localStorage.clear();
});

// ---------------------------------------------------------------- R1 / R2 / R12
describe("R1/R2 brief cap, ordering, pagination", () => {
  it("shows exactly 5 highest-score cards, in score order, with shuffled input", async () => {
    const shuffled = [...eligible(8)].reverse();
    setup({ matches: shuffled });
    await waitForBrief();
    expect(cardCount()).toBe(5);
    for (let i = 0; i < 5; i++) expect(has(title(i))).toBe(true);
    for (let i = 5; i < 8; i++) expect(has(title(i))).toBe(false);
    const order = screen.getAllByText(/^Role Title \d+$/).map((e) => e.textContent);
    expect(order).toEqual([0, 1, 2, 3, 4].map(title));
  });

  it("never renders ineligible fixtures", async () => {
    const ms = [
      ...eligible(2),
      mkMatch(50, { applied: false }),
      mkMatch(51, { applied: true }),
      mkMatch(52, { clicked: true }),
      mkMatch(53, { skipped: true }),
      mkMatch(54, { job: null }),
    ];
    setup({ matches: ms });
    await waitForBrief();
    expect(cardCount()).toBe(2);
    for (const n of [50, 51, 52, 53]) expect(has(title(n))).toBe(false);
    expect(screen.queryByText(/Role Title 5[0-4]/)).toBeNull();
  });

  it("applied undefined is eligible", async () => {
    setup({ matches: [mkMatch(0, { applied: undefined as any })] });
    await waitForBrief();
    expect(has(title(0))).toBe(true);
  });

  it("12 eligible: 'Show 5 more (7 remaining)' -> 10 -> 'Show 2 more' -> 12 -> no button", async () => {
    setup({ matches: eligible(12) });
    await waitForBrief();
    expect(cardCount()).toBe(5);
    expect(bodyHas(/7 more scored lower\./)).toBe(true);
    await click(screen.getByRole("button", { name: "Show 5 more (7 remaining)" }));
    await waitFor(() => expect(cardCount()).toBe(10));
    for (let i = 0; i < 10; i++) expect(has(title(i))).toBe(true);
    expect(has(title(10))).toBe(false);
    expect(screen.queryByRole("button", { name: /Show 5 more/ })).toBeNull();
    await click(screen.getByRole("button", { name: "Show 2 more" }));
    await waitFor(() => expect(cardCount()).toBe(12));
    expect(screen.queryByRole("button", { name: /Show \d+ more/ })).toBeNull();
    expect(bodyHas(/scored lower/)).toBe(false);
  });

  it("exactly 6 eligible -> 'Show 1 more'; exactly 5 -> no button, no prose", async () => {
    const { unmount } = setup({ matches: eligible(6) });
    await waitForBrief();
    expect(screen.getByRole("button", { name: "Show 1 more" })).toBeInTheDocument();
    unmount();
    setup({ matches: eligible(5) });
    await waitForBrief();
    expect(screen.queryByRole("button", { name: /Show \d+ more/ })).toBeNull();
    expect(bodyHas(/scored lower/)).toBe(false);
  });

  it("exactly 10 eligible -> 'Show 5 more (5 remaining)' is NOT used; label is 'Show 5 more'", async () => {
    setup({ matches: eligible(10) });
    await waitForBrief();
    expect(screen.queryByRole("button", { name: /remaining/ })).toBeNull();
    expect(screen.getByRole("button", { name: "Show 5 more" })).toBeInTheDocument();
  });

  it("exactly 11 eligible -> 'Show 5 more (6 remaining)'", async () => {
    setup({ matches: eligible(11) });
    await waitForBrief();
    await click(screen.getByRole("button", { name: "Show 5 more (6 remaining)" }));
    await waitFor(() => expect(cardCount()).toBe(10));
    expect(screen.getByRole("button", { name: "Show 1 more" })).toBeInTheDocument();
  });

  it("singular prose 'One more scored lower.' with 6 eligible", async () => {
    setup({ matches: eligible(6) });
    await waitForBrief();
    expect(bodyHas(/One more scored lower\./)).toBe(true);
  });

  it("headline: 'Five worth your time.' with >5, remains so after expanding", async () => {
    setup({ matches: eligible(12) });
    await waitForBrief();
    expect(screen.getByText("Five worth your time.")).toBeInTheDocument();
    await click(screen.getByRole("button", { name: /Show 5 more/ }));
    await waitFor(() => expect(cardCount()).toBe(10));
    expect(screen.getByText("Five worth your time.")).toBeInTheDocument();
    expect(screen.queryByText(/10 worth your time/)).toBeNull();
    expect(screen.queryByText(/Ten worth/)).toBeNull();
  });

  it.each([[1, "One"], [2, "Two"], [3, "Three"], [4, "Four"], [5, "Five"]])("headline for %i eligible -> %s", async (n, word) => {
    setup({ matches: eligible(n as number) });
    await waitForBrief();
    expect(screen.getByText(`${word} worth your time.`)).toBeInTheDocument();
  });

  it("zero eligible -> 'Nothing new today.' and no show-more", async () => {
    setup({ matches: [mkMatch(1, { skipped: true }), mkMatch(2, { job: null })] });
    expect(await screen.findByText("Nothing new today.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Show \d+ more/ })).toBeNull();
  });

  it("getMatches called exactly once on page load and once after expanding", async () => {
    setup({ matches: eligible(12) });
    await waitForBrief();
    await click(screen.getByRole("button", { name: /Show 5 more/ }));
    await waitFor(() => expect(cardCount()).toBe(10));
    expect(mockApi.getMatches).toHaveBeenCalledTimes(1);
    expect(mockApi.getVisited).not.toHaveBeenCalled();
  });
});

describe("R12 card title/company elements", () => {
  it("title and company are own elements; meta line has neither", async () => {
    setup({ matches: eligible(1) });
    await waitForBrief();
    const t = screen.getByText(title(0));
    const c = screen.getByText(company(0));
    expect(t).toBeInTheDocument();
    expect(c).toBeInTheDocument();
    expect(t).not.toBe(c);
    expect(t.contains(c)).toBe(false);
    expect(c.contains(t)).toBe(false);
    // any element whose text includes " · " must not contain the title or company
    const metas = Array.from(document.body.querySelectorAll("*")).filter(
      (e) => e.children.length === 0 && (e.textContent || "").includes(" · ")
    );
    expect(metas.length).toBeGreaterThan(0);
    for (const m of metas) {
      expect(m.textContent).not.toContain(title(0));
      expect(m.textContent).not.toContain(company(0));
    }
    expect(metas.some((m) => /Berlin/.test(m.textContent || ""))).toBe(true);
  });
});

// ---------------------------------------------------------------- R3a
describe("R3a card skip promotes next hidden match without refetch", () => {
  it("7 eligible: skip top card -> still 5, 6th visible, only that one gone, getMatches once", async () => {
    setup({ matches: eligible(7) });
    await waitForBrief();
    expect(has(title(5))).toBe(false);
    await skipViaCard(0);
    await waitFor(() => expect(mockApi.markMatchAsSkipped).toHaveBeenCalledTimes(1));
    expect(mockApi.markMatchAsSkipped.mock.calls[0][0]).toBe("m-00");
    await waitFor(() => expect(has(title(0))).toBe(false));
    await waitFor(() => expect(has(title(5))).toBe(true));
    expect(cardCount()).toBe(5);
    for (const n of [1, 2, 3, 4, 5]) expect(screen.getAllByText(title(n))).toHaveLength(1);
    expect(has(title(6))).toBe(false);
    expect(mockApi.getMatches).toHaveBeenCalledTimes(1);
  });

  it("skipping a middle card removes exactly that _id", async () => {
    setup({ matches: eligible(7) });
    await waitForBrief();
    await skipViaCard(2);
    await waitFor(() => expect(mockApi.markMatchAsSkipped).toHaveBeenCalledWith("m-02", expect.anything(), undefined));
    await waitFor(() => expect(has(title(2))).toBe(false));
    for (const n of [0, 1, 3, 4, 5]) await waitFor(() => expect(has(title(n))).toBe(true));
    expect(cardCount()).toBe(5);
  });

  it("skip reason is passed through to markMatchAsSkipped", async () => {
    setup({ matches: eligible(2) });
    await waitForBrief();
    await skipViaCard(0);
    await waitFor(() => expect(mockApi.markMatchAsSkipped).toHaveBeenCalled());
    expect(mockApi.markMatchAsSkipped.mock.calls[0][1]).toBe("salary");
  });

  it("skipping the last remaining card shows the empty state", async () => {
    setup({ matches: eligible(1) });
    await waitForBrief();
    await skipViaCard(0);
    expect(await screen.findByText("Nothing new today.")).toBeInTheDocument();
    expect(has(title(0))).toBe(false);
  });

  it("skip failure ({error}) keeps card, promotes nothing, shows error", async () => {
    setup({ matches: eligible(7) });
    mockApi.markMatchAsSkipped.mockResolvedValue({ error: "boom" });
    await waitForBrief();
    await skipViaCard(0);
    await waitFor(() => expect(mockApi.markMatchAsSkipped).toHaveBeenCalled());
    await settle();
    expect(has(title(0))).toBe(true);
    expect(has(title(5))).toBe(false);
    expect(cardCount()).toBe(5);
    expect(screen.queryByText("Job skipped.")).toBeNull();
    expect(document.body.textContent).toMatch(/boom|error|fail|couldn|try again|unable|wrong/i);
  });

  it("skip failure (throw) keeps card, promotes nothing", async () => {
    setup({ matches: eligible(7) });
    mockApi.markMatchAsSkipped.mockRejectedValue(new Error("net"));
    await waitForBrief();
    await skipViaCard(0);
    await waitFor(() => expect(mockApi.markMatchAsSkipped).toHaveBeenCalled());
    await settle();
    expect(has(title(0))).toBe(true);
    expect(has(title(5))).toBe(false);
    expect(screen.queryByText("Job skipped.")).toBeNull();
  });
});

// ---------------------------------------------------------------- R3b / R4 / R5 / R6
describe("R3b sidebar Yes", () => {
  it("7 eligible: Yes on top card -> markMatchApplied(id,true) once, still 5 cards, 6th visible, one fetch", async () => {
    setup({ matches: eligible(7) });
    await waitForBrief();
    await openSidebarFor(0, 0);
    await click(screen.getByRole("button", { name: "Yes" }));
    await waitFor(() => expect(mockApi.markMatchApplied).toHaveBeenCalledTimes(1));
    expect(mockApi.markMatchApplied).toHaveBeenCalledWith("m-00", true);
    await waitFor(() => expect(has(title(0))).toBe(false));
    await waitFor(() => expect(has(title(5))).toBe(true));
    expect(cardCount()).toBe(5);
    for (const n of [1, 2, 3, 4, 5]) expect(screen.getAllByText(title(n))).toHaveLength(1);
    expect(has(title(6))).toBe(false);
    expect(mockApi.getMatches).toHaveBeenCalledTimes(1);
    expect(mockApi.markMatchAsSkipped).not.toHaveBeenCalled();
  });

  it("Yes on a NON-top card removes exactly that match", async () => {
    setup({ matches: eligible(7) });
    await waitForBrief();
    await openSidebarFor(3, 3);
    await click(screen.getByRole("button", { name: "Yes" }));
    await waitFor(() => expect(mockApi.markMatchApplied).toHaveBeenCalledWith("m-03", true));
    await waitFor(() => expect(has(title(3))).toBe(false));
    for (const n of [0, 1, 2, 4, 5]) expect(has(title(n))).toBe(true);
    expect(cardCount()).toBe(5);
  });

  it("R6: success toast 'Marked applied.' with link to /tracker", async () => {
    setup({ matches: eligible(2) });
    await waitForBrief();
    await openSidebarFor(0);
    await click(screen.getByRole("button", { name: "Yes" }));
    const toast = await screen.findByText(/Marked applied\./);
    expect(toast).toBeInTheDocument();
    const links = Array.from(document.querySelectorAll("a")).filter((a) => (a.getAttribute("href") || "").startsWith("/tracker"));
    expect(links.length).toBeGreaterThan(0);
  });

  it("R4: double-click Yes calls markMatchApplied exactly once", async () => {
    setup({ matches: eligible(7) });
    let resolve!: (v: any) => void;
    mockApi.markMatchApplied.mockImplementation(() => new Promise((r) => (resolve = r)));
    await waitForBrief();
    await openSidebarFor(0);
    const yes = screen.getByRole("button", { name: "Yes" });
    fireEvent.click(yes);
    fireEvent.click(yes);
    await act(async () => { resolve({}); });
    await waitFor(() => expect(has(title(0))).toBe(false));
    expect(mockApi.markMatchApplied).toHaveBeenCalledTimes(1);
    expect(cardCount()).toBe(5);
  });

  it("R4: double-click Yes after resolution (fast) still one call", async () => {
    setup({ matches: eligible(3) });
    await waitForBrief();
    await openSidebarFor(0);
    const yes = screen.getByRole("button", { name: "Yes" });
    fireEvent.click(yes);
    fireEvent.click(yes);
    await waitFor(() => expect(mockApi.markMatchApplied).toHaveBeenCalled());
    await settle();
    expect(mockApi.markMatchApplied).toHaveBeenCalledTimes(1);
  });

  it("R5: Yes failure ({error}) keeps card, no promotion, sidebar shows error, no toast", async () => {
    setup({ matches: eligible(7) });
    mockApi.markMatchApplied.mockResolvedValue({ error: "nope" });
    await waitForBrief();
    await openSidebarFor(0);
    await click(screen.getByRole("button", { name: "Yes" }));
    expect(await screen.findByText("Couldn't save your answer. Please try again.")).toBeInTheDocument();
    expect(has(title(0))).toBe(true);
    expect(has(title(5))).toBe(false);
    expect(cardCount()).toBe(5);
    expect(screen.queryByText(/Marked applied\./)).toBeNull();
  });

  it("R5: Yes failure (throw) shows error, card stays", async () => {
    setup({ matches: eligible(7) });
    mockApi.markMatchApplied.mockRejectedValue(new Error("net"));
    await waitForBrief();
    await openSidebarFor(0);
    await click(screen.getByRole("button", { name: "Yes" }));
    expect(await screen.findByText("Couldn't save your answer. Please try again.")).toBeInTheDocument();
    expect(has(title(0))).toBe(true);
    expect(has(title(5))).toBe(false);
  });

  it("R5: after Yes failure a retry can succeed", async () => {
    setup({ matches: eligible(7) });
    mockApi.markMatchApplied.mockResolvedValueOnce({ error: "x" }).mockResolvedValue({});
    await waitForBrief();
    await openSidebarFor(0);
    await click(screen.getByRole("button", { name: "Yes" }));
    await screen.findByText("Couldn't save your answer. Please try again.");
    await click(screen.getByRole("button", { name: "Yes" }));
    await waitFor(() => expect(has(title(0))).toBe(false));
    expect(mockApi.markMatchApplied).toHaveBeenCalledTimes(2);
    expect(has(title(5))).toBe(true);
  });
});

describe("R3c / R4 sidebar No", () => {
  const chooseNo = async (reasonLabel = "Salary too low") => {
    await click(screen.getByRole("button", { name: "No" }));
    await click(await screen.findByRole("button", { name: reasonLabel }));
    await click(screen.getByRole("button", { name: "Submit" }));
  };

  it("7 eligible: No+reason+Submit -> markMatchApplied(id,false,reason), NOT markMatchAsSkipped, 6th promoted", async () => {
    setup({ matches: eligible(7) });
    await waitForBrief();
    await openSidebarFor(0, 0);
    await chooseNo();
    await waitFor(() => expect(mockApi.markMatchApplied).toHaveBeenCalledTimes(1));
    const call = mockApi.markMatchApplied.mock.calls[0];
    expect(call[0]).toBe("m-00");
    expect(call[1]).toBe(false);
    expect(call[2]).toBe("salary");
    await waitFor(() => expect(has(title(0))).toBe(false));
    await waitFor(() => expect(has(title(5))).toBe(true));
    expect(cardCount()).toBe(5);
    expect(mockApi.markMatchAsSkipped).not.toHaveBeenCalled();
    expect(mockApi.getMatches).toHaveBeenCalledTimes(1);
  });

  it("No with 'Other' requires details; details are forwarded", async () => {
    setup({ matches: eligible(3) });
    await waitForBrief();
    await openSidebarFor(0);
    await click(screen.getByRole("button", { name: "No" }));
    await click(await screen.findByRole("button", { name: "Other" }));
    const submit = screen.getByRole("button", { name: "Submit" });
    await click(submit);
    await settle();
    expect(mockApi.markMatchApplied).not.toHaveBeenCalled();
    const input = screen.getByRole("textbox", { name: "" }) as HTMLElement;
    fireEvent.change(input, { target: { value: "too far away" } });
    await click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(mockApi.markMatchApplied).toHaveBeenCalled());
    const c = mockApi.markMatchApplied.mock.calls[0];
    expect(c.slice(0, 3)).toEqual(["m-00", false, "other"]);
    expect(c[3]).toBe("too far away");
  });

  it("R5: No failure ({error}) keeps card, no promotion, shows error text, never calls markMatchAsSkipped", async () => {
    setup({ matches: eligible(7) });
    mockApi.markMatchApplied.mockResolvedValue({ error: "nope" });
    await waitForBrief();
    await openSidebarFor(0);
    await chooseNo();
    expect(await screen.findByText("Couldn't save your answer. Please try again.")).toBeInTheDocument();
    expect(has(title(0))).toBe(true);
    expect(has(title(5))).toBe(false);
    expect(mockApi.markMatchAsSkipped).not.toHaveBeenCalled();
  });

  it("R5: No failure (throw) keeps card", async () => {
    setup({ matches: eligible(7) });
    mockApi.markMatchApplied.mockRejectedValue(new Error("net"));
    await waitForBrief();
    await openSidebarFor(0);
    await chooseNo();
    expect(await screen.findByText("Couldn't save your answer. Please try again.")).toBeInTheDocument();
    expect(has(title(0))).toBe(true);
    expect(has(title(5))).toBe(false);
  });

  it("No on removing the last card shows empty state", async () => {
    setup({ matches: eligible(1) });
    await waitForBrief();
    await openSidebarFor(0);
    await chooseNo();
    expect(await screen.findByText("Nothing new today.")).toBeInTheDocument();
  });

  it("Cancel in reason picker makes no API call", async () => {
    setup({ matches: eligible(2) });
    await waitForBrief();
    await openSidebarFor(0);
    await click(screen.getByRole("button", { name: "No" }));
    await click(await screen.findByRole("button", { name: "Cancel" }));
    await settle();
    expect(mockApi.markMatchApplied).not.toHaveBeenCalled();
    expect(mockApi.markMatchAsSkipped).not.toHaveBeenCalled();
    expect(has(title(0))).toBe(true);
  });
});

// ---------------------------------------------------------------- R7 / R8
describe("R7 expanded count survives removal + Undo", () => {
  it("after Show 5 more, skip a card and Undo keeps 10 cards", async () => {
    setup({ matches: eligible(12) });
    await waitForBrief();
    await click(screen.getByRole("button", { name: /Show 5 more/ }));
    await waitFor(() => expect(cardCount()).toBe(10));
    await skipViaCard(1);
    await screen.findByText("Job skipped.");
    await waitFor(() => expect(has(title(1))).toBe(false));
    // 11 remain; 10 shown after promotion
    await waitFor(() => expect(has(title(10))).toBe(true));
    expect(cardCount()).toBe(10);
    await click(screen.getByRole("button", { name: "Undo" }));
    await waitFor(() => expect(mockApi.unskipMatch).toHaveBeenCalledWith("m-01"));
    await waitFor(() => expect(has(title(1))).toBe(true));
    // must not collapse to 5
    expect(cardCount()).toBeGreaterThanOrEqual(10);
    for (const n of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) expect(has(title(n))).toBe(true);
  });

  it("Undo restores the skipped card in its score position", async () => {
    setup({ matches: eligible(7) });
    await waitForBrief();
    await skipViaCard(0);
    await screen.findByText("Job skipped.");
    await waitFor(() => expect(has(title(0))).toBe(false));
    await click(screen.getByRole("button", { name: "Undo" }));
    await waitFor(() => expect(has(title(0))).toBe(true));
    const order = screen.getAllByText(/^Role Title \d+$/).map((e) => e.textContent);
    expect(order[0]).toBe(title(0));
    expect(new Set(order).size).toBe(order.length);
    expect(mockApi.getMatches).toHaveBeenCalledTimes(1);
  });

  it("Undo does not produce duplicates", async () => {
    setup({ matches: eligible(7) });
    await waitForBrief();
    await skipViaCard(0);
    await screen.findByText("Job skipped.");
    await click(screen.getByRole("button", { name: "Undo" }));
    await waitFor(() => expect(has(title(0))).toBe(true));
    await settle();
    expect(screen.getAllByText(title(0))).toHaveLength(1);
    for (let n = 0; n < 7; n++) expect(screen.queryAllByText(title(n)).length).toBeLessThanOrEqual(1);
  });
});

describe("R8 opened card skip+Undo does not return to the brief", () => {
  it("Open listing keeps the card; skip + Undo -> it does NOT come back", async () => {
    setup({ matches: eligible(3) });
    await waitForBrief();
    await click(screen.getAllByRole("button", { name: "Open listing" })[0]);
    await waitFor(() => expect(mockApi.markMatchClick).toHaveBeenCalledWith("m-00"));
    expect(window.open).toHaveBeenCalled();
    expect(has(title(0))).toBe(true);
    expect(cardCount()).toBe(3);
    await skipViaCard(0);
    await screen.findByText("Job skipped.");
    await waitFor(() => expect(has(title(0))).toBe(false));
    await click(screen.getByRole("button", { name: "Undo" }));
    await waitFor(() => expect(mockApi.unskipMatch).toHaveBeenCalledWith("m-00"));
    await settle();
    expect(has(title(0))).toBe(false);
    expect(cardCount()).toBe(2);
  });

  it("control: a never-opened card DOES come back on Undo", async () => {
    setup({ matches: eligible(3) });
    await waitForBrief();
    await skipViaCard(1);
    await screen.findByText("Job skipped.");
    await click(screen.getByRole("button", { name: "Undo" }));
    await waitFor(() => expect(has(title(1))).toBe(true));
  });

  it("Open listing whose markMatchClick FAILS: card stays", async () => {
    setup({ matches: eligible(3) });
    mockApi.markMatchClick.mockResolvedValue({ error: "x" });
    await waitForBrief();
    await click(screen.getAllByRole("button", { name: "Open listing" })[0]);
    await waitFor(() => expect(mockApi.markMatchClick).toHaveBeenCalled());
    await settle();
    expect(has(title(0))).toBe(true);
    expect(cardCount()).toBe(3);
  });
});

// ---------------------------------------------------------------- R9
describe("R9 footer / empty-state links", () => {
  const hrefs = () => Array.from(document.querySelectorAll("a")).map((a) => ({ t: a.textContent, h: a.getAttribute("href") }));
  it("footer has opened + skipped links", async () => {
    setup({ matches: eligible(3) });
    await waitForBrief();
    expect(screen.getByText("That's today.")).toBeInTheDocument();
    const o = screen.getByRole("link", { name: "See opened jobs →" });
    expect(o.getAttribute("href")).toBe("/today?view=visited");
    const s = screen.getByRole("link", { name: "See skipped jobs →" });
    expect(s.getAttribute("href")).toMatch(/view=skipped/);
    expect(hrefs().length).toBeGreaterThan(1);
  });
  it("empty state has both links", async () => {
    setup({ matches: [] });
    await screen.findByText("Nothing new today.");
    expect(screen.getByRole("link", { name: "See opened jobs →" }).getAttribute("href")).toBe("/today?view=visited");
    expect(screen.getByRole("link", { name: "See skipped jobs →" })).toBeInTheDocument();
  });
  it("empty state after skipping last card has both links", async () => {
    setup({ matches: eligible(1) });
    await waitForBrief();
    await skipViaCard(0);
    await screen.findByText("Nothing new today.");
    expect(screen.getByRole("link", { name: "See opened jobs →" })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------- R10 visited view
describe("R10 visited view", () => {
  const visitedRows = () => [
    mkMatch(1, { clicked: true, applied: null }),
    mkMatch(2, { clicked: true, applied: false, notAppliedReason: { category: "salary" } }),
    mkMatch(3, { clicked: true, applied: null, job: null }),
    mkMatch(4, { clicked: true, applied: false, notAppliedReason: { category: "location" } }),
  ];

  it("lists rows; does not call getMatches as a requirement; renders even if getMatches rejects", async () => {
    // setup's getMatches default reads opts.matches inside an async fn, so a throwing
    // getter makes getMatches reject from the very first call, before/at render.
    setup({
      view: "visited",
      visited: visitedRows(),
      get matches(): any {
        throw new Error("getMatches should not matter in visited view");
      },
    });
    expect(await screen.findByText(title(1))).toBeInTheDocument();
    expect(mockApi.getMatches).not.toHaveBeenCalled();
  });

  it("shows rows with title, company; job:null row is Unknown role/company with no View job button", async () => {
    setup({ view: "visited", visited: visitedRows() });
    expect(await screen.findByText(title(1))).toBeInTheDocument();
    expect(screen.getByText(title(2))).toBeInTheDocument();
    expect(screen.getByText(company(1))).toBeInTheDocument();
    expect(screen.getByText("Unknown role")).toBeInTheDocument();
    expect(screen.getByText("Unknown company")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "View job" }).length + screen.queryAllByRole("link", { name: "View job" }).length).toBe(3);
    expect(mockApi.getVisited).toHaveBeenCalled();
  });

  it("applied:false rows show 'Didn't apply: <label>' and 'Actually, I applied'; applied:null rows don't", async () => {
    setup({ view: "visited", visited: visitedRows() });
    await screen.findByText(title(1));
    expect(screen.getByText(/Didn't apply: Salary too low/)).toBeInTheDocument();
    expect(screen.getByText(/Didn't apply: Location\/remote policy/)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Actually, I applied" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /Answer \/ write answers/ }).length).toBeGreaterThan(0);
  });

  it("empty -> 'No opened jobs waiting for an answer'", async () => {
    setup({ view: "visited", visited: [] });
    expect(await screen.findByText("No opened jobs waiting for an answer")).toBeInTheDocument();
  });

  it("error object -> 'Failed to load opened jobs'", async () => {
    setup({ view: "visited" });
    mockApi.getVisited.mockResolvedValue({ error: "x" });
    cleanupAndRender();
    expect(await screen.findByText(/Failed to load opened jobs/)).toBeInTheDocument();
    expect(screen.queryByText("No opened jobs waiting for an answer")).toBeNull();
  });

  it("throw -> 'Failed to load opened jobs'", async () => {
    setup({ view: "visited" });
    mockApi.getVisited.mockRejectedValue(new Error("net"));
    cleanupAndRender();
    expect(await screen.findByText(/Failed to load opened jobs/)).toBeInTheDocument();
  });

  it("'Actually, I applied' success removes the row only", async () => {
    setup({ view: "visited", visited: visitedRows() });
    await screen.findByText(title(2));
    await click(screen.getAllByRole("button", { name: "Actually, I applied" })[0]);
    await waitFor(() => expect(mockApi.markMatchApplied).toHaveBeenCalledWith("m-02", true));
    expect(mockApi.markMatchApplied).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(has(title(2))).toBe(false));
    expect(has(title(1))).toBe(true);
    expect(has(title(4))).toBe(true);
    expect(screen.getAllByRole("button", { name: "Actually, I applied" })).toHaveLength(1);
  });

  it("'Actually, I applied' failure keeps the row and shows error", async () => {
    setup({ view: "visited", visited: visitedRows() });
    mockApi.markMatchApplied.mockResolvedValue({ error: "no" });
    await screen.findByText(title(2));
    await click(screen.getAllByRole("button", { name: "Actually, I applied" })[0]);
    expect(await screen.findByText("Couldn't save your answer. Please try again.")).toBeInTheDocument();
    expect(has(title(2))).toBe(true);
  });

  it("'Actually, I applied' throw keeps the row and shows error", async () => {
    setup({ view: "visited", visited: visitedRows() });
    mockApi.markMatchApplied.mockRejectedValue(new Error("net"));
    await screen.findByText(title(2));
    await click(screen.getAllByRole("button", { name: "Actually, I applied" })[0]);
    expect(await screen.findByText("Couldn't save your answer. Please try again.")).toBeInTheDocument();
    expect(has(title(2))).toBe(true);
  });

  it("'Answer / write answers' opens sidebar for THAT row; Yes removes it", async () => {
    const rows = [mkMatch(1, { clicked: true }), mkMatch(5, { clicked: true }), mkMatch(6, { clicked: true })];
    setup({ view: "visited", visited: rows });
    await screen.findByText(title(5));
    let el: HTMLElement | null = screen.getByText(title(5));
    let target: HTMLElement | undefined;
    while (el && !target) {
      const inner = within(el).queryAllByRole("button", { name: /Answer \/ write answers/ });
      if (inner.length === 1) target = inner[0];
      else el = el.parentElement;
    }
    expect(target).toBeDefined();
    await click(target!);
    expect(await screen.findByText(`${title(5)} at ${company(5)}`)).toBeInTheDocument();
    expect(screen.queryByText(`${title(1)} at ${company(1)}`)).toBeNull();
    await click(await screen.findByRole("button", { name: "Yes" }));
    await waitFor(() => expect(mockApi.markMatchApplied).toHaveBeenCalledWith("m-05", true));
    await waitFor(() => expect(has(title(5))).toBe(false));
    expect(has(title(1))).toBe(true);
    expect(has(title(6))).toBe(true);
  });

  it("sidebar No in visited view removes the row and does not skip", async () => {
    setup({ view: "visited", visited: visitedRows() });
    await screen.findByText(title(1));
    let el: HTMLElement | null = screen.getByText(title(1));
    let target: HTMLElement | undefined;
    while (el && !target) {
      const inner = within(el).queryAllByRole("button", { name: /Answer \/ write answers/ });
      if (inner.length === 1) target = inner[0];
      else el = el.parentElement;
    }
    await click(target!);
    await screen.findByText(`${title(1)} at ${company(1)}`);
    await click(screen.getByRole("button", { name: "No" }));
    await click(await screen.findByRole("button", { name: "Missing required skills" }));
    await click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(mockApi.markMatchApplied).toHaveBeenCalled());
    expect(mockApi.markMatchApplied.mock.calls[0].slice(0, 3)).toEqual(["m-01", false, "skills_gap"]);
    expect(mockApi.markMatchAsSkipped).not.toHaveBeenCalled();
    await waitFor(() => expect(has(title(1))).toBe(false));
  });

  it("'Not for me' in visited view -> skip -> row removed", async () => {
    setup({ view: "visited", visited: visitedRows() });
    await screen.findByText(title(1));
    let el: HTMLElement | null = screen.getByText(title(1));
    let target: HTMLElement | undefined;
    while (el && !target) {
      const inner = within(el).queryAllByRole("button", { name: "Not for me" });
      if (inner.length === 1) target = inner[0];
      else el = el.parentElement;
    }
    expect(target).toBeDefined();
    await click(target!);
    await click(await screen.findByRole("button", { name: "Salary too low" }));
    await click(screen.getByRole("button", { name: "Skip this job" }));
    await waitFor(() => expect(mockApi.markMatchAsSkipped).toHaveBeenCalled());
    expect(mockApi.markMatchAsSkipped.mock.calls[0][0]).toBe("m-01");
    await waitFor(() => expect(has(title(1))).toBe(false));
    expect(has(title(2))).toBe(true);
  });

  it("getVisited is NOT called on the normal brief; getMatches IS", async () => {
    setup({ matches: eligible(2) });
    await waitForBrief();
    expect(mockApi.getVisited).not.toHaveBeenCalled();
    expect(mockApi.getMatches).toHaveBeenCalledTimes(1);
  });

  it("visited view does not require getMatches (never called is acceptable, nothing from it rendered)", async () => {
    setup({ view: "visited", visited: visitedRows(), matches: eligible(3) });
    await screen.findByText(title(1));
    expect(has(title(0))).toBe(false); // a brief match (not in visited) must not appear
  });
});

// ---------------------------------------------------------------- R11
describe("R11 skipped view has no sidebar machinery", () => {
  it("no 'Did you apply' prompt in skipped view even after visibility change", async () => {
    setup({ view: "skipped", skipped: [mkMatch(1, { skipped: true })] });
    await screen.findByText(title(1));
    await returnToTab();
    await settle();
    expect(screen.queryByText(/Did you apply/)).toBeNull();
    expect(mockApi.markMatchApplied).not.toHaveBeenCalled();
  });
});

// helper defined last (hoisted function declaration)
function cleanupAndRender() {
  const { cleanup } = require("@testing-library/react");
  cleanup();
  render(<ChakraProvider><TodayPage /></ChakraProvider>);
}
