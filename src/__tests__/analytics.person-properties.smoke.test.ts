import type { User } from "@/types/User";

jest.mock("posthog-js", () => ({
  __esModule: true,
  default: {
    setPersonProperties: jest.fn(),
    identify: jest.fn(),
    reset: jest.fn(),
    capture: jest.fn(),
    init: jest.fn(),
  },
}));

let setUserPersonProperties: (user: User) => void;
let identifyUser: (id: string) => void;
let resetAnalyticsUser: () => void;
let mockSetPersonProperties: jest.Mock;

beforeAll(() => {
  process.env.NEXT_PUBLIC_POSTHOG_KEY = "test-key";
  jest.resetModules();
  const ph = require("posthog-js").default as Record<string, jest.Mock>;
  mockSetPersonProperties = ph.setPersonProperties;
  const mod = require("@/utils/analytics") as {
    setUserPersonProperties: (user: User) => void;
    identifyUser: (id: string) => void;
    resetAnalyticsUser: () => void;
  };
  setUserPersonProperties = mod.setUserPersonProperties;
  identifyUser = mod.identifyUser;
  resetAnalyticsUser = mod.resetAnalyticsUser;
});

afterAll(() => {
  delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
  jest.resetModules();
});

const makeUser = (): User => ({
  id: "user-1",
  name: "Test User",
  email: "test@example.com",
  phone: "+1-555-0100",
  currentLocation: "New York",
  createdAt: new Date("2024-01-01"),
  resume: {
    summary: "A developer",
    skills: ["TypeScript"],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    languages: [],
    achievements: [],
    volunteerExperience: [],
    interests: [],
  },
  preferences: {
    jobTypes: ["full-time"],
    location: ["remote"],
    remoteOnly: false,
    minSalary: 50000,
    industries: ["tech"],
    minScore: 70,
    matchingEnabled: true,
  },
  isVerified: true,
  answeredQuestionsCount: 5,
  socialLinks: { linkedin: "https://linkedin.com/in/test" },
});

describe("setUserPersonProperties (smoke)", () => {
  afterEach(() => {
    // Clear identity state so guard is clean between smoke tests.
    resetAnalyticsUser();
    mockSetPersonProperties.mockClear();
  });

  it("sends the allow-listed non-PII properties and excludes PII keys", () => {
    const user = makeUser();
    identifyUser(user.id);
    setUserPersonProperties(user);

    expect(mockSetPersonProperties).toHaveBeenCalledTimes(1);
    const calledWith = mockSetPersonProperties.mock.calls[0][0] as Record<string, unknown>;

    expect(calledWith).toMatchObject({
      is_verified: true,
      has_resume: true,
      matching_enabled: true,
      min_score: 70,
    });

    expect(calledWith).not.toHaveProperty("email");
    expect(calledWith).not.toHaveProperty("name");
    expect(calledWith).not.toHaveProperty("currentLocation");
    expect(calledWith).not.toHaveProperty("phone");
    expect(calledWith).not.toHaveProperty("id");
    expect(calledWith).not.toHaveProperty("socialLinks");
  });

  it("omits matching_enabled and min_score when preferences is null", () => {
    const user: User = { ...makeUser(), preferences: null };
    identifyUser(user.id);
    setUserPersonProperties(user);

    const calledWith = mockSetPersonProperties.mock.calls[0][0] as Record<string, unknown>;
    expect(calledWith).toHaveProperty("is_verified");
    expect(calledWith).toHaveProperty("has_resume");
    expect(calledWith).not.toHaveProperty("matching_enabled");
    expect(calledWith).not.toHaveProperty("min_score");
  });
});
