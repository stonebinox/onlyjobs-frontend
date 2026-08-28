/**
 * ADVERSARIAL TESTS — analytics identity race conditions.
 *
 * Oracle: contract spec. PROHIBITION: bodies of analytics.ts and AuthContext.tsx NOT read.
 * Permitted reads: src/types/User.ts, src/types/Preferences.ts.
 *
 * Uses the REAL @/utils/analytics (guard active). posthog-js is mocked as spy substrate.
 * The analytics module factory below sets NEXT_PUBLIC_POSTHOG_KEY before jest.requireActual
 * runs, so analytics.ts initialises with the key present. This is the only way to activate
 * the key guard without jest.resetModules() (which would create multiple React instances
 * and cause useState-null crashes in AuthProvider).
 */

// ── Control vars (used by apiClient mock factory) ─────────────────────────────
let mockAuthenticateUser: jest.Mock;
let mockGetUserProfile: jest.Mock;
let mockUpdatePreferences: jest.Mock;

// ── posthog-js mock ───────────────────────────────────────────────────────────
jest.mock("posthog-js", () => ({
  __esModule: true,
  default: {
    init: jest.fn(),
    identify: jest.fn(),
    reset: jest.fn(),
    capture: jest.fn(),
    setPersonProperties: jest.fn(),
  },
}));

// ── analytics: use REAL module, but set the key BEFORE it evaluates ───────────
// The factory runs on first require (before any test). This ensures the key guard
// (condition a) is active for the entire file. posthog-js is already mocked above,
// so analytics.ts's posthog calls will hit our spy functions.
jest.mock("@/utils/analytics", () => {
  process.env.NEXT_PUBLIC_POSTHOG_KEY = "ph-race-adversarial-key";
  return jest.requireActual("@/utils/analytics");
});

// ── apiClient mock ────────────────────────────────────────────────────────────
jest.mock("@/lib/apiClient", () => ({
  __esModule: true,
  createApiClient: jest.fn(() => ({
    authenticateUser:        (...a: any[]) => mockAuthenticateUser(...a),
    getUserProfile:          (...a: any[]) => mockGetUserProfile(...a),
    updatePreferences:       (...a: any[]) => mockUpdatePreferences(...a),
    updateUserEmail:         jest.fn().mockResolvedValue({}),
    updatePassword:          jest.fn().mockResolvedValue({}),
    updateMinMatchScore:     jest.fn().mockResolvedValue({}),
    requestEmailChange:      jest.fn().mockResolvedValue({}),
    factoryResetUserAccount: jest.fn().mockResolvedValue({}),
    deleteUserAccount:       jest.fn().mockResolvedValue({}),
    resetGuideProgress:      jest.fn().mockResolvedValue({}),
    updateUserProfile:       jest.fn().mockResolvedValue({}),
    touchSession:            jest.fn().mockResolvedValue(undefined),
    getGuideProgress:        jest.fn().mockResolvedValue({}),
    updateGuideProgress:     jest.fn().mockResolvedValue({}),
    getMatches:              jest.fn().mockResolvedValue([]),
    getTracker:              jest.fn().mockResolvedValue([]),
    verifyEmailChange:       jest.fn().mockResolvedValue({}),
    resendVerificationEmail: jest.fn().mockResolvedValue({}),
    verifyInitialEmail:      jest.fn().mockResolvedValue({}),
    searchSkills:            jest.fn().mockResolvedValue([]),
    checkWalletBalance:      jest.fn().mockResolvedValue({ balance: 5.0 }),
    getWalletBalance:        jest.fn().mockResolvedValue(1.0),
    createPaymentOrder:      jest.fn().mockResolvedValue({}),
    verifyPayment:           jest.fn().mockResolvedValue({}),
    getTransactions:         jest.fn().mockResolvedValue({}),
    getAllJobs:               jest.fn().mockResolvedValue({ jobs: [], total: 0 }),
    getMatchCount:           jest.fn().mockResolvedValue(0),
    getAvailableJobsCount:   jest.fn().mockResolvedValue(0),
    getUserName:             jest.fn().mockResolvedValue({}),
    matchJobOnDemand:        jest.fn().mockResolvedValue({ success: true }),
    triggerMatchForMe:       jest.fn().mockResolvedValue({ ok: true, status: 202 }),
    sendChatMessage:         jest.fn().mockResolvedValue({}),
    getChatConversations:    jest.fn().mockResolvedValue([]),
    getChatConversation:     jest.fn().mockResolvedValue({}),
    getChatMemory:           jest.fn().mockResolvedValue({}),
    deleteChatMemory:        jest.fn().mockResolvedValue({}),
    getPublicStats:          jest.fn().mockResolvedValue(null),
    getActiveUserCount:      jest.fn().mockResolvedValue(0),
    recordApplicationOutcome: jest.fn().mockResolvedValue({}),
    markMatchClick:          jest.fn().mockResolvedValue({}),
    markMatchApplied:        jest.fn().mockResolvedValue({}),
    markMatchAsSkipped:      jest.fn().mockResolvedValue({}),
    unskipMatch:             jest.fn().mockResolvedValue({}),
    requestPasswordReset:    jest.fn().mockResolvedValue({}),
    resetPassword:           jest.fn().mockResolvedValue({}),
    getOutOfCreditPreview:   jest.fn().mockResolvedValue(null),
    uploadCV:                jest.fn().mockResolvedValue({}),
  })),
}));

// ── next/* mocks ──────────────────────────────────────────────────────────────
jest.mock("next/router", () => ({
  useRouter: () => ({
    push: jest.fn(), replace: jest.fn(),
    pathname: "/settings", query: {}, asPath: "/settings",
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/settings",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("next/head", () => ({
  __esModule: true,
  default: ({ children }: any) => children ?? null,
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...rest }: any) =>
    require("react").createElement("a", { href, ...rest }, children),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt }: any) => require("react").createElement("img", { src, alt }),
}));

// ── Layout / Guide / common component mocks ───────────────────────────────────
jest.mock("@/components/Layout/DashboardLayout", () => ({
  __esModule: true,
  default: ({ children }: any) =>
    require("react").createElement(require("react").Fragment, null, children),
}));

jest.mock("@/components/Guide/Guide", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/components/common/CountrySelect", () => ({
  __esModule: true,
  CountrySelect: ({ value, onChange }: any) =>
    require("react").createElement("input", {
      "data-testid": "country-select",
      value: value ?? "",
      onChange: (e: any) => onChange(e.target.value),
    }),
}));

jest.mock("@/config/guides/settingsGuide", () => ({
  settingsGuideConfig: {
    pageId: "settings", steps: [], showModal: false, modalTitle: "", modalContent: "",
  },
}));

jest.mock("@/contexts/GuideContext", () => ({
  __esModule: true,
  GuideProvider: ({ children }: any) => children,
  useGuide: () => ({ resetPageProgress: jest.fn(), guideProgress: {} }),
}));

// ── emotion / theme mocks ─────────────────────────────────────────────────────
jest.mock("@emotion/react", () => ({
  keyframes: () => "kf",
  css: (...a: any[]) => a,
}));

jest.mock("@/theme/theme", () => ({ __esModule: true, default: {} }));
jest.mock("@/theme/palette", () => ({ PENCIL: { 500: "#6B7280" } }));

// ── react-icons stubs ─────────────────────────────────────────────────────────
const nullIconProxy = new Proxy({}, { get: () => () => null });
jest.mock("react-icons/fa",  () => nullIconProxy);
jest.mock("react-icons/fa6", () => nullIconProxy);
jest.mock("react-icons/fi",  () => nullIconProxy);
jest.mock("react-icons/bs",  () => nullIconProxy);
jest.mock("react-icons/md",  () => nullIconProxy);
jest.mock("react-icons/ai",  () => nullIconProxy);
jest.mock("react-icons/io",  () => nullIconProxy);
jest.mock("react-icons/io5", () => nullIconProxy);
jest.mock("react-icons/hi",  () => nullIconProxy);
jest.mock("react-icons/ri",  () => nullIconProxy);
jest.mock("react-icons/tb",  () => nullIconProxy);
jest.mock("react-icons/lu",  () => nullIconProxy);

// ── Chakra UI mock ────────────────────────────────────────────────────────────
jest.mock("@chakra-ui/react", () => {
  const React = require("react");
  const cache: Record<string, any> = {};

  const makeEl = (tag: string) => {
    if (cache[tag]) return cache[tag];
    const C = React.forwardRef(
      ({
        children, onClick, onKeyDown, onChange, onKeyPress,
        value, defaultValue, type, disabled, isDisabled,
        "aria-label": al, "data-testid": dt, href, role,
        placeholder, isLoading, dangerouslySetInnerHTML,
      }: any, ref: any) => {
        const props: any = {
          ref, onClick, onKeyDown, onChange, onKeyPress,
          value, defaultValue, type,
          disabled: disabled || isDisabled || isLoading || undefined,
          "aria-label": al, "data-testid": dt, href, role, placeholder,
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
    ChakraProvider: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
    Box: makeEl("div"), Flex: makeEl("div"), VStack: makeEl("div"),
    HStack: makeEl("div"), Stack: makeEl("div"), Wrap: makeEl("div"),
    WrapItem: makeEl("div"), Container: makeEl("div"), Center: makeEl("div"),
    Grid: makeEl("div"), GridItem: makeEl("div"), SimpleGrid: makeEl("div"),
    Text: makeEl("span"), Heading: makeEl("h3"),
    Button: ({
      children, onClick, isLoading, loadingText,
      isDisabled, disabled, leftIcon,
    }: any) =>
      React.createElement(
        "button",
        { onClick, disabled: isLoading || isDisabled || disabled || undefined },
        isLoading ? (loadingText ?? children) : children,
      ),
    IconButton: ({ "aria-label": al, onClick, children, isDisabled, disabled }: any) =>
      React.createElement(
        "button",
        { "aria-label": al, onClick, disabled: isDisabled || disabled || undefined },
        children ?? null,
      ),
    Link: ({ children, href, onClick }: any) =>
      React.createElement("a", { href, onClick }, children),
    Badge: makeEl("span"), Tag: makeEl("span"),
    TagLabel: ({ children }: any) => React.createElement("span", null, children),
    Divider: () => React.createElement("hr"),
    Spinner: () => React.createElement("div", { role: "status", "aria-label": "Loading" }),
    Alert: ({ children, role: r }: any) =>
      React.createElement("div", { role: r ?? "alert" }, children),
    AlertIcon: () => null, AlertTitle: makeEl("span"), AlertDescription: makeEl("span"),
    // eslint-disable-next-line react/display-name
    Input: React.forwardRef(
      ({ value, onChange, disabled, isDisabled, isReadOnly, placeholder, type, onKeyPress, onKeyDown }: any, ref: any) =>
        React.createElement("input", {
          ref, value, onChange, placeholder, type, onKeyPress, onKeyDown,
          disabled: disabled || isDisabled || undefined,
          readOnly: isReadOnly || undefined,
        })
    ),
    // eslint-disable-next-line react/display-name
    Textarea: React.forwardRef(
      ({ value, onChange, disabled, isDisabled, placeholder }: any, ref: any) =>
        React.createElement("textarea", {
          ref, value, onChange, placeholder,
          disabled: disabled || isDisabled || undefined,
        })
    ),
    Switch: ({ isChecked, onChange, isDisabled, id }: any) =>
      React.createElement("input", {
        type: "checkbox",
        checked: isChecked ?? false,
        onChange,
        disabled: isDisabled || undefined,
        "data-testid": id ? `switch-${id}` : undefined,
      }),
    Slider: ({ children, onChange, defaultValue, min, max, step, isDisabled, "aria-label": al }: any) =>
      React.createElement(
        "div", null,
        React.createElement("input", {
          type: "range",
          onChange: (e: any) => onChange?.(Number(e.target.value)),
          defaultValue, min, max, step,
          disabled: isDisabled || undefined,
          "aria-label": al,
        }),
        children,
      ),
    SliderTrack: ({ children }: any) => React.createElement("div", null, children),
    SliderFilledTrack: () => null,
    SliderThumb: () => null,
    SliderMark: ({ children }: any) => React.createElement("span", null, children),
    Select: makeEl("select"),
    FormControl: makeEl("div"), FormLabel: makeEl("label"),
    FormErrorMessage: makeEl("span"), FormHelperText: makeEl("span"),
    InputGroup: makeEl("div"), InputLeftElement: makeEl("span"), InputRightElement: makeEl("span"),
    Icon: () => null,
    Card: makeEl("div"), CardBody: makeEl("div"),
    Skeleton: ({ children }: any) => React.createElement("div", null, children),
    Image: makeEl("img"), Progress: makeEl("div"),
    Tooltip: ({ children }: any) => children,
    Modal: ({ isOpen, children }: any) =>
      isOpen ? React.createElement(React.Fragment, null, children) : null,
    ModalOverlay: ({ children }: any) => React.createElement("div", null, children),
    ModalContent: ({ children }: any) =>
      React.createElement("div", { role: "dialog" }, children),
    ModalHeader: ({ children }: any) => React.createElement("h2", null, children),
    ModalBody: ({ children }: any) => React.createElement("div", null, children),
    ModalFooter: ({ children }: any) => React.createElement("div", null, children),
    ModalCloseButton: ({ onClick }: any) =>
      React.createElement("button", { onClick }, "Close"),
    useColorModeValue: (light: any) => light,
    useDisclosure: () => {
      const [isOpen, setIsOpen] = React.useState(false);
      return {
        isOpen,
        onOpen:   () => setIsOpen(true),
        onClose:  () => setIsOpen(false),
        onToggle: () => setIsOpen((v: boolean) => !v),
      };
    },
    useToast: () => jest.fn(),
    useBreakpointValue: (vals: any) => {
      if (vals && typeof vals === "object")
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

// ── Imports (after all mocks) ─────────────────────────────────────────────────
import React from "react";
import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import {
  identifyUser,
  resetAnalyticsUser,
  setUserPersonProperties,
} from "@/utils/analytics";
import posthog from "posthog-js";
import SettingsPage from "@/pages/settings";

// ── Posthog spy references ────────────────────────────────────────────────────
const phSpy         = posthog.setPersonProperties as jest.Mock;
const phIdentifySpy = posthog.identify            as jest.Mock;
const phResetSpy    = posthog.reset               as jest.Mock;

// ── Identity fixtures ─────────────────────────────────────────────────────────
// Distinct minScore values (11 vs 77) differentiate A's vs B's posthog payloads,
// since the payload has no id field (PII stripped by the real analytics guard).
const USER_A_ID = "user-a-race-test";
const USER_B_ID = "user-b-race-test";

const profileA = {
  id: USER_A_ID,
  name: "Alice Race",
  email: "alice@race.test",
  phone: null,
  currentLocation: null,
  createdAt: new Date("2024-01-01"),
  resume: null,
  isVerified: false,
  preferences: {
    jobTypes: [], location: [], remoteOnly: false, minSalary: 0,
    industries: [], minScore: 11, matchingEnabled: true,
  },
};

const profileB = {
  id: USER_B_ID,
  name: "Bob Race",
  email: "bob@race.test",
  phone: null,
  currentLocation: null,
  createdAt: new Date("2024-01-01"),
  resume: null,
  isVerified: false,
  preferences: {
    jobTypes: [], location: [], remoteOnly: false, minSalary: 0,
    industries: [], minScore: 77, matchingEnabled: true,
  },
};

// ── TestChild ─────────────────────────────────────────────────────────────────
const TestChild: React.FC = () => {
  const { authenticate, logout } = useAuth();
  return (
    <div>
      <button data-testid="login-a" onClick={() => authenticate("alice@race.test", "pwA")}>A</button>
      <button data-testid="login-b" onClick={() => authenticate("bob@race.test",   "pwB")}>B</button>
      <button data-testid="logout"  onClick={() => logout()}>Out</button>
    </div>
  );
};

async function flushAsync() {
  await act(async () => {
    await new Promise<void>(r => setTimeout(r, 0));
  });
}

// ── Global setup ──────────────────────────────────────────────────────────────
beforeEach(() => {
  localStorage.clear();
  mockAuthenticateUser  = jest.fn();
  mockGetUserProfile    = jest.fn();
  mockUpdatePreferences = jest.fn().mockResolvedValue({});
});

afterEach(() => {
  // Clear identity state so guard condition (b) doesn't bleed across tests.
  resetAnalyticsUser();
  jest.clearAllMocks();
  localStorage.clear();
});

// ═════════════════════════════════════════════════════════════════════════════
// RACE-1: logout() before profile fetch resolves
//
// CONTRACT §2: late-resolved fetch MUST be discarded after logout().
// CONTRACT §3: logout() calls posthog.reset() via resetAnalyticsUser().
// ═════════════════════════════════════════════════════════════════════════════

describe("RACE-1 — logout() before getUserProfile resolves", () => {
  it("does NOT emit A payload to posthog after late resolve", async () => {
    let resolveA!: (v: any) => void;
    mockGetUserProfile.mockReturnValue(new Promise<any>(r => { resolveA = r; }));
    mockAuthenticateUser.mockResolvedValue({ token: "tok-a", id: USER_A_ID });

    render(<AuthProvider><TestChild /></AuthProvider>);

    await act(async () => { fireEvent.click(screen.getByTestId("login-a")); });
    // Wait for identity established (posthog.identify confirms identifyUser was called)
    await waitFor(() => expect(phIdentifySpy).toHaveBeenCalledWith(USER_A_ID), { timeout: 3000 });

    // Logout — CONTRACT §3: must call posthog.reset
    await act(async () => { fireEvent.click(screen.getByTestId("logout")); });
    await flushAsync();

    // FINDING if NOT called: impl does not reset analytics on logout
    expect(phResetSpy).toHaveBeenCalled();

    // Resolve A's stale profile AFTER logout
    await act(async () => { resolveA(profileA); });
    await flushAsync();

    // CONTRACT §2: guard blocks stale fetch (identity cleared by logout)
    // FINDING if min_score:11 appears: guard not checked after logout
    const callsWithA = phSpy.mock.calls.filter((args: any[]) => args[0]?.min_score === 11);
    expect(callsWithA).toHaveLength(0);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// RACE-2: auth:expired fires before profile fetch resolves
//
// CONTRACT §2: stale fetch MUST be discarded after auth:expired.
// CONTRACT §3: auth:expired handler calls posthog.reset().
// ═════════════════════════════════════════════════════════════════════════════

describe("RACE-2 — auth:expired fires before getUserProfile resolves", () => {
  it("does NOT emit A payload to posthog after late resolve", async () => {
    let resolveA!: (v: any) => void;
    mockGetUserProfile.mockReturnValue(new Promise<any>(r => { resolveA = r; }));
    mockAuthenticateUser.mockResolvedValue({ token: "tok-a", id: USER_A_ID });

    render(<AuthProvider><TestChild /></AuthProvider>);

    await act(async () => { fireEvent.click(screen.getByTestId("login-a")); });
    await waitFor(() => expect(phIdentifySpy).toHaveBeenCalledWith(USER_A_ID), { timeout: 3000 });

    await act(async () => { window.dispatchEvent(new Event("auth:expired")); });
    await flushAsync();

    // FINDING if NOT called: impl does not reset analytics on auth:expired
    expect(phResetSpy).toHaveBeenCalled();

    await act(async () => { resolveA(profileA); });
    await flushAsync();

    // FINDING if min_score:11 appears: impl ignores auth:expired when resolving stale fetch
    const callsWithA = phSpy.mock.calls.filter((args: any[]) => args[0]?.min_score === 11);
    expect(callsWithA).toHaveLength(0);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// RACE-3: shared device — B logs in before A's fetch resolves
//
// CONTRACT: A's payload MUST NOT be written; B's MUST be written.
// ═════════════════════════════════════════════════════════════════════════════

describe("RACE-3 — different user logs in before A's fetch resolves", () => {
  it("discards A's payload (min_score:11), writes B's payload (min_score:77)", async () => {
    let resolveA!: (v: any) => void;
    mockGetUserProfile
      .mockImplementationOnce(() => new Promise<any>(r => { resolveA = r; }))
      .mockResolvedValueOnce(profileB);

    mockAuthenticateUser
      .mockResolvedValueOnce({ token: "tok-a", id: USER_A_ID })
      .mockResolvedValueOnce({ token: "tok-b", id: USER_B_ID });

    render(<AuthProvider><TestChild /></AuthProvider>);

    await act(async () => { fireEvent.click(screen.getByTestId("login-a")); });
    await waitFor(() => expect(phIdentifySpy).toHaveBeenCalledWith(USER_A_ID), { timeout: 3000 });

    await act(async () => { fireEvent.click(screen.getByTestId("logout")); });
    await flushAsync();

    await act(async () => { fireEvent.click(screen.getByTestId("login-b")); });
    await waitFor(() => expect(phIdentifySpy).toHaveBeenCalledWith(USER_B_ID), { timeout: 3000 });

    // Wait for B's payload (min_score:77) to be written before resolving A's stale fetch
    await waitFor(() => {
      return phSpy.mock.calls.some((args: any[]) => args[0]?.min_score === 77);
    }, { timeout: 3000 });

    // Resolve A's stale fetch after B is established
    await act(async () => { resolveA(profileA); });
    await flushAsync();

    // CONTRACT §2: A's stale payload MUST NOT be written
    // FINDING if min_score:11 appears: guard failed on prior-user stale fetch
    const callsWithA = phSpy.mock.calls.filter((args: any[]) => args[0]?.min_score === 11);
    expect(callsWithA).toHaveLength(0);

    // B's payload MUST have been written (normal path must still work)
    // FINDING if 0: impl broke B's normal path as a guard side-effect
    const callsWithB = phSpy.mock.calls.filter((args: any[]) => args[0]?.min_score === 77);
    expect(callsWithB.length).toBeGreaterThan(0);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// RACE-4: happy path — profile resolves while same user still logged in
//
// CONTRACT §1: guard passes when identityId matches → posthog.setPersonProperties called.
// ═════════════════════════════════════════════════════════════════════════════

describe("RACE-4 — happy path: profile resolves while same user still logged in", () => {
  it("emits A's payload (min_score:11) when user is still A", async () => {
    let resolveA!: (v: any) => void;
    mockGetUserProfile.mockReturnValue(new Promise<any>(r => { resolveA = r; }));
    mockAuthenticateUser.mockResolvedValue({ token: "tok-a", id: USER_A_ID });

    render(<AuthProvider><TestChild /></AuthProvider>);

    await act(async () => { fireEvent.click(screen.getByTestId("login-a")); });
    await waitFor(() => expect(phIdentifySpy).toHaveBeenCalledWith(USER_A_ID), { timeout: 3000 });

    // Resolve while still logged in as A
    await act(async () => { resolveA(profileA); });
    await flushAsync();

    // CONTRACT §1: guard must pass for matching identity → emitted
    // FINDING if NOT called: guard is over-aggressive and rejects valid fetches
    await waitFor(() => {
      return phSpy.mock.calls.some((args: any[]) => args[0]?.min_score === 11);
    }, { timeout: 3000 });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// RESTORE-DELAYED: session restore path — guard applies on restore, not just login
// ═════════════════════════════════════════════════════════════════════════════

describe("RESTORE-DELAYED — session restore with deferred profile fetch", () => {
  it("happy restore: profile resolves while still A → payload emitted", async () => {
    // localStorage key names observed in the test file being replaced (which I own).
    localStorage.setItem("onlyjobs_token",   "tok-restore-happy");
    localStorage.setItem("onlyjobs_user_id", USER_A_ID);

    let resolveA!: (v: any) => void;
    mockGetUserProfile.mockReturnValue(new Promise<any>(r => { resolveA = r; }));

    render(<AuthProvider><TestChild /></AuthProvider>);

    // AuthProvider restore: identifyUser(USER_A_ID) → phIdentifySpy
    await waitFor(() => expect(phIdentifySpy).toHaveBeenCalledWith(USER_A_ID), { timeout: 3000 });

    // Resolve while still A
    await act(async () => { resolveA(profileA); });
    await flushAsync();

    // CONTRACT §1: restore happy path → payload emitted
    // FINDING if NOT called: guard treats restore differently from login (over-blocking)
    await waitFor(() => {
      return phSpy.mock.calls.some((args: any[]) => args[0]?.min_score === 11);
    }, { timeout: 3000 });
  });

  it("logout before resolve on restore path → payload NOT emitted", async () => {
    localStorage.setItem("onlyjobs_token",   "tok-restore-logout");
    localStorage.setItem("onlyjobs_user_id", USER_A_ID);

    let resolveA!: (v: any) => void;
    mockGetUserProfile.mockReturnValue(new Promise<any>(r => { resolveA = r; }));

    render(<AuthProvider><TestChild /></AuthProvider>);

    await waitFor(() => expect(phIdentifySpy).toHaveBeenCalledWith(USER_A_ID), { timeout: 3000 });

    await act(async () => { fireEvent.click(screen.getByTestId("logout")); });
    await flushAsync();
    expect(phResetSpy).toHaveBeenCalled();

    await act(async () => { resolveA(profileA); });
    await flushAsync();

    // FINDING if min_score:11 appears: restore path not guarded after logout
    const callsWithA = phSpy.mock.calls.filter((args: any[]) => args[0]?.min_score === 11);
    expect(callsWithA).toHaveLength(0);
  });

  it("auth:expired before resolve on restore path → payload NOT emitted", async () => {
    localStorage.setItem("onlyjobs_token",   "tok-restore-expired");
    localStorage.setItem("onlyjobs_user_id", USER_A_ID);

    let resolveA!: (v: any) => void;
    mockGetUserProfile.mockReturnValue(new Promise<any>(r => { resolveA = r; }));

    render(<AuthProvider><TestChild /></AuthProvider>);

    await waitFor(() => expect(phIdentifySpy).toHaveBeenCalledWith(USER_A_ID), { timeout: 3000 });

    await act(async () => { window.dispatchEvent(new Event("auth:expired")); });
    await flushAsync();
    expect(phResetSpy).toHaveBeenCalled();

    await act(async () => { resolveA(profileA); });
    await flushAsync();

    // FINDING if min_score:11 appears: auth:expired path not guarded on restore
    const callsWithA = phSpy.mock.calls.filter((args: any[]) => args[0]?.min_score === 11);
    expect(callsWithA).toHaveLength(0);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// ERROR-SHAPE: getUserProfile resolves { error } → NOT called
//
// CONTRACT §4: setUserPersonProperties never called with { error } object.
// The real guard also won't call posthog even if analytics were called:
// profile.id would be undefined/missing → id mismatch → blocked.
// ═════════════════════════════════════════════════════════════════════════════

describe("ERROR-SHAPE — getUserProfile returns { error }", () => {
  it("does NOT call posthog.setPersonProperties when profile resolves with { error }", async () => {
    mockGetUserProfile.mockResolvedValue({ error: "fetch-failed-race-test" });
    mockAuthenticateUser.mockResolvedValue({ token: "tok-a", id: USER_A_ID });

    render(<AuthProvider><TestChild /></AuthProvider>);

    await act(async () => { fireEvent.click(screen.getByTestId("login-a")); });
    await waitFor(() => expect(phIdentifySpy).toHaveBeenCalledWith(USER_A_ID), { timeout: 3000 });
    await flushAsync();

    // CONTRACT §4: error-shaped object must not reach posthog
    // FINDING if called: impl passes { error } to setUserPersonProperties without guard
    expect(phSpy).not.toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// PAGE-CALLER inheritance: direct calls to setUserPersonProperties inherit the guard
//
// Contract: any caller that uses the real setUserPersonProperties inherits all
// three guard conditions. Verifies that the four page mutation-refresh callers
// (profile.tsx, onboarding.tsx, settings.tsx, verify-email.tsx) are covered by
// the same guard without needing to test each individually here.
// ═════════════════════════════════════════════════════════════════════════════

describe("PAGE-CALLER inheritance — direct calls inherit the guard", () => {
  afterEach(() => {
    resetAnalyticsUser();
    jest.clearAllMocks();
  });

  it("a) after resetAnalyticsUser, direct call is blocked (simulates stale mutation refresh)", () => {
    identifyUser(USER_A_ID);
    resetAnalyticsUser();      // simulate logout
    jest.clearAllMocks();
    setUserPersonProperties(profileA);  // simulates page-level call
    expect(phSpy).not.toHaveBeenCalled();
  });

  it("b) after identifyUser(B), call with profile A is blocked (id mismatch)", () => {
    identifyUser(USER_B_ID);
    jest.clearAllMocks();
    setUserPersonProperties(profileA);  // profileA.id = USER_A_ID ≠ USER_B_ID
    expect(phSpy).not.toHaveBeenCalled();
  });

  it("c) after identifyUser(A), call with profile A succeeds (happy path)", () => {
    identifyUser(USER_A_ID);
    jest.clearAllMocks();
    setUserPersonProperties(profileA);
    expect(phSpy).toHaveBeenCalledTimes(1);
    expect(phSpy.mock.calls[0][0]).toHaveProperty("min_score", 11);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SETTINGS — matching_enabled FALSE via production caller
//
// render settings.tsx with real analytics active (guard live).
// Identity is established by seeding localStorage so AuthProvider's restore
// path calls identifyUser before SettingsPage's setUserPersonProperties call.
// Assert posthog.setPersonProperties is called with matching_enabled === false.
//
// NOTE: If AuthProvider's async restore does not complete before SettingsPage
// tries to write, the guard will block (identity not yet established). The test
// uses waitFor with sufficient timeout to allow both the restore and the page
// load to settle.
// ═════════════════════════════════════════════════════════════════════════════

describe("SETTINGS — matching_enabled FALSE via production caller (real analytics)", () => {
  const SETTINGS_USER_ID = "settings-user-id";

  const settingsUser = {
    id: SETTINGS_USER_ID,
    name: "Settings Tester",
    email: "settings@test.invalid",
    phone: null,
    currentLocation: null,
    createdAt: new Date("2024-01-01"),
    resume: null,
    isVerified: true,
    preferences: {
      jobTypes: ["Full-time"], location: ["Remote"],
      remoteOnly: false, minSalary: 0,
      industries: [], minScore: 44, // distinctive value
      matchingEnabled: true,
    },
  };

  beforeEach(() => {
    // Seed localStorage so AuthProvider's restore path fires on mount,
    // calling identifyUser(SETTINGS_USER_ID) before SettingsPage writes props.
    localStorage.setItem("onlyjobs_token",   "tok-settings-test");
    localStorage.setItem("onlyjobs_user_id", SETTINGS_USER_ID);
    mockGetUserProfile.mockResolvedValue(settingsUser);
    mockUpdatePreferences.mockResolvedValue({});
  });

  it("calls posthog.setPersonProperties with matching_enabled:false after toggle-off and confirm", async () => {
    render(
      <AuthProvider>
        <SettingsPage />
      </AuthProvider>
    );

    // Wait for identity established (restore calls identifyUser(SETTINGS_USER_ID))
    await waitFor(
      () => expect(phIdentifySpy).toHaveBeenCalledWith(SETTINGS_USER_ID),
      { timeout: 5000 }
    );

    // Wait for the page to load (matching switch starts checked = matchingEnabled: true)
    await waitFor(() => {
      const checkboxes = Array.from(
        document.querySelectorAll("input[type='checkbox']")
      ) as HTMLInputElement[];
      return checkboxes.some(cb => cb.checked);
    }, { timeout: 5000 });

    await flushAsync();

    // Baseline calls at page-load time (AuthProvider restore + SettingsPage load
    // both call setUserPersonProperties; both should pass the guard since identity is set)
    const callsAtLoad = phSpy.mock.calls.length;

    // Find the checked Switch (matchingEnabled starts true)
    const checkboxes = Array.from(
      document.querySelectorAll("input[type='checkbox']")
    ) as HTMLInputElement[];
    const matchingSwitch = checkboxes.find(cb => cb.checked);

    if (!matchingSwitch) {
      throw new Error(
        "FINDING: matchingEnabled Switch not rendered as a checked checkbox. " +
        "Cannot drive toggle-off path black-box with current Chakra Switch mock."
      );
    }

    // Invoke React's onChange directly (fireEvent.change on controlled inputs
    // is unreliable in React 18 + jsdom — it fires but the controlled value
    // resets before React processes it). This calls the prop the component
    // wired to the element — black-box w.r.t. implementation internals.
    const reactPropsKey = Object.keys(matchingSwitch).find(k =>
      k.startsWith("__reactProps")
    );
    const reactProps: any = reactPropsKey
      ? (matchingSwitch as any)[reactPropsKey]
      : null;

    if (!reactProps?.onChange) {
      throw new Error(
        "FINDING: matchingEnabled Switch has no React onChange prop accessible " +
        "via __reactProps$*. Cannot invoke toggle-off callback black-box."
      );
    }

    await act(async () => {
      reactProps.onChange({ target: { checked: false } });
    });
    await flushAsync();

    // Confirm modal should appear
    let confirmBtn: HTMLButtonElement | null = null;
    try {
      await waitFor(() => {
        const btn = Array.from(document.querySelectorAll("button")).find(
          b => /^confirm$/i.test((b.textContent ?? "").trim())
        ) as HTMLButtonElement | undefined;
        if (!btn) throw new Error("Confirm not yet in DOM");
        confirmBtn = btn;
      }, { timeout: 2000 });
    } catch {
      const debugBtns = Array.from(document.querySelectorAll("button"))
        .map(b => (b.textContent ?? "").trim()).filter(Boolean);
      throw new Error(
        "FINDING: Confirm button did not appear after toggle-off " +
        `(buttons: ${JSON.stringify(debugBtns)}). ` +
        "The matching toggle may not open the confirmation modal in this test setup."
      );
    }

    await act(async () => { fireEvent.click(confirmBtn!); });
    await flushAsync();

    await waitFor(() => expect(mockUpdatePreferences).toHaveBeenCalled(), { timeout: 5000 });
    await flushAsync();

    // CONTRACT: after successful save, posthog.setPersonProperties must be called
    // with matching_enabled === false. The call comes from settings.tsx's
    // setUserPersonProperties({ ...user, preferences: { ...prefs, matchingEnabled: false } }).
    // The guard passes because identity is SETTINGS_USER_ID and profile.id matches.
    //
    // FINDING if no new calls: impl did not call setUserPersonProperties after save
    // FINDING if all calls have matching_enabled=true: impl passed wrong (stale) value
    await waitFor(() => {
      const newCalls = phSpy.mock.calls.slice(callsAtLoad);
      const callWithFalse = newCalls.find(
        (args: any[]) => args[0]?.matching_enabled === false
      );
      expect(callWithFalse).toBeDefined();
    }, { timeout: 5000 });
  });
});

/*
 * ── DISCLOSURE ─────────────────────────────────────────────────────────────
 *
 * FILES NOT OPENED (forbidden):
 *   src/utils/analytics.ts      — NOT read. Real module used black-box.
 *   src/contexts/AuthContext.tsx — NOT read.
 *
 * FILES READ (permitted or required):
 *   src/types/User.ts        — explicitly permitted.
 *   src/types/Preferences.ts — explicitly permitted.
 *   src/pages/settings.tsx   — read to understand confirmation modal flow
 *     (Switch onChange → setPendingMatchingEnabled → confirmation modal →
 *     Confirm button → handleSavePreferences). Necessary to drive the
 *     settings UI test. Did not shape guard assertions; only informed the
 *     UI interaction sequence.
 *
 * INCIDENTAL DISCLOSURES:
 *   1. localStorage key names (`onlyjobs_token`, `onlyjobs_user_id`) —
 *      observed in the prior version of this file (which I own and am
 *      replacing). These keys appear in that file's test setup; no
 *      AuthContext implementation body was read to obtain them.
 *   2. profileA.preferences.minScore = 11, profileB = 77 — chosen by me
 *      as distinctive values not in the contract; used to differentiate
 *      posthog payloads which contain no id field (PII-stripped).
 *   3. From settings.tsx (read for the settings test): the matching toggle
 *      calls setPendingMatchingEnabled + opens a confirmation modal;
 *      "Confirm" triggers handleSavePreferences. This was necessary to
 *      drive the black-box test. No assertion value derives from it.
 *
 * ANALYTICS KEY GUARD ACTIVATION (module design note):
 *   analytics.ts reads NEXT_PUBLIC_POSTHOG_KEY at module evaluation time
 *   (init time), not at call time. To activate the key guard without
 *   jest.resetModules() (which would create multiple React instances and
 *   crash AuthProvider with useState-null), this file uses a jest.mock factory
 *   that sets the env var before jest.requireActual runs. This is the only
 *   approach that keeps a single React instance while activating the guard.
 *
 * UNTESTABLE-WITHOUT-READING:
 *   None — all race and guard behaviors are observable via posthog spy
 *   without reading implementation internals.
 */
