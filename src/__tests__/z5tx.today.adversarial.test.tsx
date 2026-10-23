import React from "react";
import { render, screen, waitFor, fireEvent, act, within } from "@testing-library/react";
import { ChakraProvider } from "@chakra-ui/react";
import type { JobResult } from "@/types/JobResult";
import type { RejectionSignalSummary } from "@/types/RejectionSignalSummary";

const api: Record<string, jest.Mock> = {};
let viewParam: string | null = null;

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
  useSearchParams: () => ({ get: (k: string) => (k === "view" ? viewParam : null) }),
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
  DashboardLayout: ({ children }: any) => <div>{children}</div>,
}));
jest.mock("@/components/SEO", () => ({ __esModule: true, default: () => null, SEO: () => null }));
jest.mock("@/components/Dashboard/OutOfCreditPreview", () => ({
  __esModule: true,
  default: () => null,
  OutOfCreditPreview: () => null,
}));
jest.mock("@/components/Dashboard/ResumeRequiredBanner", () => ({
  __esModule: true,
  default: () => null,
  ResumeRequiredBanner: () => null,
}));
jest.mock("@/components/Dashboard/LocationPromptBanner", () => ({
  __esModule: true,
  default: () => null,
  LocationPromptBanner: () => null,
}));
jest.mock("@/components/Dashboard/GenerateAnswer", () => ({
  __esModule: true,
  default: () => null,
  GenerateAnswer: () => null,
}));
jest.mock("@/components/Dashboard/JobChatSection", () => ({
  __esModule: true,
  default: () => null,
  JobChatSection: () => null,
}));
jest.mock("@/utils/analytics", () => ({ trackEvent: jest.fn() }));

import TodayPage from "@/pages/today";

const mkJob = (i: number, company: string) => ({
  _id: `job${i}`,
  title: `Role${i}`,
  company,
  location: ["Remote"],
  salary: { min: 100, max: 200, currency: "USD", estimated: false },
  tags: [],
  source: "t",
  description: "d",
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
  postedDate: "2026-01-01",
  scrapedDate: "2026-01-01",
  url: `https://example.com/job${i}`,
});

const mkMatch = (i: number, company: string, over: Partial<JobResult> = {}): JobResult => ({
  _id: `match${i}`,
  userId: "u1",
  jobId: `job${i}`,
  matchScore: 90 - i,
  verdict: "good",
  reasoning: "because",
  clicked: false,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
  skipped: false,
  applied: null,
  job: mkJob(i, company) as any,
  ...over,
});

const sig = (over: Partial<RejectionSignalSummary> = {}): RejectionSignalSummary => ({
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

let counter = 0;
const uniq = (base: string) => `${base}${++counter}`;

const setup = (opts: {
  matches: JobResult[];
  visited?: JobResult[];
  skipRes?: any;
  appliedRes?: any;
  revokeRes?: any;
  view?: string | null;
}) => {
  viewParam = opts.view ?? null;
  for (const k of Object.keys(api)) delete api[k];
  const set = (name: string, impl: any) => {
    api[name] = typeof impl === "function" ? jest.fn(impl) : jest.fn().mockResolvedValue(impl);
  };
  set("getMatches", opts.matches);
  set("getVisited", opts.visited ?? []);
  set("getSkipped", []);
  set("checkWalletBalance", { balance: 10 });
  set("getOutOfCreditPreview", { error: "none" });
  set("getUserProfile", {
    id: "u1",
    name: "N",
    email: "e@e.com",
    phone: null,
    currentLocation: "Berlin",
    resume: { skills: ["a"], experience: ["x"], summary: "s" },
    preferences: null,
  });
  set("markMatchClick", {});
  set("unskipMatch", {});
  set("markMatchAsSkipped", opts.skipRes ?? { message: "ok", signal: null });
  set("markMatchApplied", opts.appliedRes ?? { message: "ok", signal: null });
  set("revokeBlock", opts.revokeRes ?? { message: "ok", revoked: 1 });
  return render(
    <ChakraProvider>
      <TodayPage />
    </ChakraProvider>
  );
};

const skipCard = async (cardIndex: number) => {
  const btns = await screen.findAllByRole("button", { name: "Not for me" });
  await click(btns[cardIndex]);
  await click(await screen.findByText("Salary too low"));
  await click(await screen.findByRole("button", { name: "Skip this job" }));
};

const openSidebarViaListing = async (cardIndex: number) => {
  const open = await screen.findAllByRole("button", { name: "Open listing" });
  await click(open[cardIndex]);
  await waitFor(() => expect(api.markMatchClick).toHaveBeenCalled());
  await act(async () => {
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
};

const answerNo = async () => {
  await click(await screen.findByRole("button", { name: "No" }));
  await click(await screen.findByText("Salary too low"));
  await click(await screen.findByRole("button", { name: "Submit" }));
};

const keepBtn = (company: string) =>
  screen.queryByRole("button", { name: new RegExp(`Keep showing ${company}`) }) ??
  screen.queryByText(new RegExp(`Keep showing ${company}`));

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

beforeEach(() => {
  window.open = jest.fn() as any;
});

describe("S3 skip toast (real BriefEntry + page)", () => {
  test("Z1 temporary company signal -> Hiding <company> until D Mon, Undo + Keep showing", async () => {
    const c = uniq("Tether");
    setup({
      matches: [mkMatch(1, c), mkMatch(2, "Other")],
      skipRes: { message: "m", signal: sig({ company: c }) },
    });
    await skipCard(0);
    expect(await screen.findByText(`Hiding ${c} until 22 Dec.`)).toBeInTheDocument();
    expect(screen.getByText("Undo")).toBeInTheDocument();
    expect(keepBtn(c)).toBeTruthy();
    expect(api.markMatchAsSkipped).toHaveBeenCalledWith("match1", "salary", undefined);
  });

  test("Z2 permanent company signal", async () => {
    const c = uniq("Perm");
    setup({
      matches: [mkMatch(1, c)],
      skipRes: { message: "m", signal: sig({ company: c, duration: "permanent", blockedUntil: null }) },
    });
    await skipCard(0);
    expect(await screen.findByText(`Hiding ${c} permanently.`)).toBeInTheDocument();
    expect(screen.queryByText(/until/)).toBeNull();
    expect(keepBtn(c)).toBeTruthy();
  });

  test("Z3 company_role temporary and permanent", async () => {
    const c = uniq("CR");
    setup({
      matches: [mkMatch(1, c)],
      skipRes: { message: "m", signal: sig({ scope: "company_role", company: c }) },
    });
    await skipCard(0);
    expect(await screen.findByText(`Hiding this role at ${c} until 22 Dec.`)).toBeInTheDocument();
    expect(keepBtn(c)).toBeTruthy();
  });

  test("Z3 company_role permanent", async () => {
    const c = uniq("CRP");
    setup({
      matches: [mkMatch(1, c)],
      skipRes: {
        message: "m",
        signal: sig({ scope: "company_role", company: c, duration: "permanent", blockedUntil: null }),
      },
    });
    await skipCard(0);
    expect(await screen.findByText(`Hiding this role at ${c} permanently.`)).toBeInTheDocument();
    expect(keepBtn(c)).toBeTruthy();
  });

  test.each(["role", "attribute"] as const)("Z4 %s signal -> similar-jobs copy, no Keep showing", async (scope) => {
    const c = uniq("Soft");
    setup({
      matches: [mkMatch(1, c)],
      skipRes: { message: "m", signal: sig({ scope, company: c }) },
    });
    await skipCard(0);
    expect(await screen.findByText("Got it - we'll score similar jobs lower.")).toBeInTheDocument();
    expect(screen.queryByText(/Keep showing/)).toBeNull();
    expect(screen.queryByText(/Hiding/)).toBeNull();
  });

  test("Z5 null signal -> Job skipped. with Undo and no Hiding text", async () => {
    const c = uniq("NullSig");
    setup({ matches: [mkMatch(1, c)], skipRes: { message: "m", signal: null } });
    await skipCard(0);
    expect(await screen.findByText("Job skipped.")).toBeInTheDocument();
    expect(screen.getByText("Undo")).toBeInTheDocument();
    expect(screen.queryByText(/Hiding/)).toBeNull();
    expect(screen.queryByText(/Keep showing/)).toBeNull();
  });

  test("Z6 Keep showing revokes THAT card's matchId once, card stays removed, success copy; double-click one call", async () => {
    const c1 = uniq("Alpha");
    const c2 = uniq("Beta");
    const c3 = uniq("Gamma");
    setup({
      matches: [mkMatch(1, c1), mkMatch(2, c2), mkMatch(3, c3)],
      skipRes: { message: "m", signal: sig({ company: c2 }) },
      revokeRes: new Promise((r) => setTimeout(() => r({ message: "ok", revoked: 1 }), 30)),
    });
    await screen.findByText("Role2");
    await skipCard(1);
    const keep = (await screen.findByRole("button", { name: new RegExp(`Keep showing ${c2}`) })) as HTMLElement;
    // Two separate sync acts so busy state flushes between clicks (a real double-click),
    // then let the pending revoke settle inside act.
    act(() => {
      fireEvent.click(keep);
    });
    act(() => {
      fireEvent.click(keep);
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 60));
    });
    expect(await screen.findByText(`OK - ${c2} will keep showing up.`)).toBeInTheDocument();
    expect(api.revokeBlock).toHaveBeenCalledTimes(1);
    expect(api.revokeBlock).toHaveBeenCalledWith("match2");
    expect(api.unskipMatch).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByText("Role2")).toBeNull());
    expect(screen.getByText("Role1")).toBeInTheDocument();
    expect(screen.getByText("Role3")).toBeInTheDocument();
  });

  test("Z7 revokeBlock {error} shows the error, no unskip", async () => {
    const c = uniq("RevErr");
    setup({
      matches: [mkMatch(1, c)],
      skipRes: { message: "m", signal: sig({ company: c }) },
      revokeRes: { error: "Boom from server" },
    });
    await skipCard(0);
    await click(await screen.findByRole("button", { name: new RegExp(`Keep showing ${c}`) }));
    expect(await screen.findByText(/Boom from server/)).toBeInTheDocument();
    expect(screen.queryByText(`OK - ${c} will keep showing up.`)).toBeNull();
    expect(api.unskipMatch).not.toHaveBeenCalled();
  });

  test("Z7 revokeBlock throw shows generic copy, no unskip", async () => {
    const c = uniq("RevThrow");
    setup({
      matches: [mkMatch(1, c)],
      skipRes: { message: "m", signal: sig({ company: c }) },
      revokeRes: () => Promise.reject(new Error("network")),
    });
    await skipCard(0);
    await click(await screen.findByRole("button", { name: new RegExp(`Keep showing ${c}`) }));
    await waitFor(() => expect(api.revokeBlock).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("Couldn't update your hidden companies. Please try again.")).toBeInTheDocument();
    expect(screen.queryByText(`OK - ${c} will keep showing up.`)).toBeNull();
    expect(api.unskipMatch).not.toHaveBeenCalled();
  });

  test("Z9 Undo on a signal skip toast calls unskipMatch, not revokeBlock", async () => {
    const c = uniq("UndoCo");
    setup({
      matches: [mkMatch(1, c), mkMatch(2, "Other")],
      skipRes: { message: "m", signal: sig({ company: c }) },
    });
    await skipCard(0);
    await click(await screen.findByText("Undo"));
    await waitFor(() => expect(api.unskipMatch).toHaveBeenCalledWith("match1"));
    expect(api.revokeBlock).not.toHaveBeenCalled();
  });
});

describe("S3 sidebar No picker signal (real banner/drawer)", () => {
  test("Z8 No + reason with company signal -> Hiding toast + Keep showing, NO Undo, card leaves", async () => {
    const c = uniq("Side");
    setup({
      matches: [mkMatch(1, c), mkMatch(2, "Other")],
      appliedRes: { message: "m", signal: sig({ company: c }) },
    });
    await screen.findByText("Role1");
    await openSidebarViaListing(0);
    await answerNo();
    expect(await screen.findByText(`Hiding ${c} until 22 Dec.`)).toBeInTheDocument();
    expect(keepBtn(c)).toBeTruthy();
    expect(screen.queryByText("Undo")).toBeNull();
    await waitFor(() => expect(screen.queryByText("Role1")).toBeNull());
    expect(api.markMatchApplied).toHaveBeenCalledWith("match1", false, "salary", undefined);
    expect(api.markMatchAsSkipped).not.toHaveBeenCalled();
  });

  test("Z8 signal null -> no Hiding toast", async () => {
    const c = uniq("SideNull");
    setup({
      matches: [mkMatch(1, c), mkMatch(2, "Other")],
      appliedRes: { message: "m", signal: null },
    });
    await screen.findByText("Role1");
    await openSidebarViaListing(0);
    await answerNo();
    await waitFor(() => expect(screen.queryByText("Role1")).toBeNull());
    expect(screen.queryByText(/Hiding/)).toBeNull();
    expect(screen.queryByText(/Keep showing/)).toBeNull();
  });

  test("Z8 Keep showing from sidebar toast revokes that match", async () => {
    const c = uniq("SideRev");
    setup({
      matches: [mkMatch(1, "Other"), mkMatch(2, c)],
      appliedRes: { message: "m", signal: sig({ company: c, duration: "permanent", blockedUntil: null }) },
    });
    await screen.findByText("Role2");
    await openSidebarViaListing(1);
    await answerNo();
    expect(await screen.findByText(`Hiding ${c} permanently.`)).toBeInTheDocument();
    await click(screen.getByRole("button", { name: new RegExp(`Keep showing ${c}`) }));
    await waitFor(() => expect(api.revokeBlock).toHaveBeenCalledWith("match2"));
    expect(api.revokeBlock).toHaveBeenCalledTimes(1);
  });
});

describe("S3 opened view", () => {
  test("Z10 Opened view skip with company signal shows Hiding toast + Keep showing", async () => {
    const c = uniq("Visited");
    setup({
      view: "visited",
      matches: [],
      visited: [mkMatch(1, c, { clicked: true })],
      skipRes: { message: "m", signal: sig({ company: c }) },
    });
    await screen.findByText("Role1");
    await skipCard(0);
    expect(await screen.findByText(`Hiding ${c} until 22 Dec.`)).toBeInTheDocument();
    expect(keepBtn(c)).toBeTruthy();
    await click(screen.getByRole("button", { name: new RegExp(`Keep showing ${c}`) }));
    await waitFor(() => expect(api.revokeBlock).toHaveBeenCalledWith("match1"));
  });
});

describe("S3 copy", () => {
  test("Z11 new toast strings contain no em/en dashes", async () => {
    const c = uniq("Dash");
    setup({
      matches: [mkMatch(1, c)],
      skipRes: { message: "m", signal: sig({ company: c }) },
    });
    await skipCard(0);
    const hiding = await screen.findByText(`Hiding ${c} until 22 Dec.`);
    await click(await screen.findByRole("button", { name: new RegExp(`Keep showing ${c}`) }));
    const ok = await screen.findByText(`OK - ${c} will keep showing up.`);
    for (const el of [hiding, ok]) expect(el.textContent).not.toMatch(/[–—]/);
    expect(screen.queryByText("Undo")).toBeDefined();
  });

  test("Z11 Z4 copy uses plain hyphen", async () => {
    const c = uniq("DashSoft");
    setup({
      matches: [mkMatch(1, c)],
      skipRes: { message: "m", signal: sig({ scope: "role", company: c }) },
    });
    await skipCard(0);
    const el = await screen.findByText(/similar jobs lower/);
    expect(el.textContent).not.toMatch(/[–—]/);
    expect(el.textContent).toBe("Got it - we'll score similar jobs lower.");
  });
});
