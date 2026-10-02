import { createApiClient } from "@/lib/apiClient";
import type { User } from "@/types/User";
import { createContext, useContext, useEffect, useState } from "react";
import { identifyUser, resetAnalyticsUser, setFirstTouchPersonPropertiesOnce, setUserPersonProperties, trackEvent } from "@/utils/analytics";
import { buildAttributionPayload } from "@/utils/attribution";

async function syncPersonProperties(getUserProfile: () => Promise<unknown>): Promise<void> {
  try {
    const profile = await getUserProfile();
    if (profile && typeof profile === "object" && !("error" in profile)) {
      setUserPersonProperties(profile as User);
    }
  } catch {
    // best-effort: analytics must never break auth
  }
}

interface AuthContextProps {
  userId: string | null;
  token: string | null;
  authenticate: (email: string, password: string) => Promise<{ isNewUser?: boolean }>;
  logout: () => void;
  isLoggedIn: boolean;
  isReady: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const { authenticateUser, getUserProfile } = createApiClient();

  const authenticate = async (email: string, password: string): Promise<{ isNewUser?: boolean }> => {
    const response = await authenticateUser(email, password);

    if (response.token && response.id) {
      try {
        localStorage.setItem("onlyjobs_token", response.token);
        localStorage.setItem("onlyjobs_user_id", response.id);
      } catch {
        // private mode / quota exceeded — proceed with in-memory context state only
      }
      setToken(response.token);
      setUserId(response.id);
      setIsLoggedIn(true);
      if (response.isNewUser) {
        try {
          const ft = buildAttributionPayload();
          // order: set_once person props -> identify -> signup_complete
          if (ft) setFirstTouchPersonPropertiesOnce(ft);
          identifyUser(response.id);
          void syncPersonProperties(getUserProfile);
          const signupProps: Record<string, string | undefined> = ft
            ? {
                initial_utm_source: ft.utmSource,
                initial_utm_medium: ft.utmMedium,
                initial_utm_campaign: ft.utmCampaign,
                initial_utm_content: ft.utmContent,
                initial_utm_term: ft.utmTerm,
                initial_referring_domain: ft.referringDomain,
                initial_landing_path: ft.landingPath,
                initial_source: (ft.utmSource || ft.utmMedium || ft.utmCampaign || ft.utmContent || ft.utmTerm)
                  ? "utm"
                  : ft.referringDomain
                  ? "referral"
                  : "direct",
              }
            : {};
          trackEvent("signup_complete", signupProps);
        } catch {
          // attribution analytics must never break signup
        }
      } else {
        identifyUser(response.id);
        void syncPersonProperties(getUserProfile);
      }
      return { isNewUser: !!response.isNewUser };
    } else {
      console.error(response.error);
      throw new Error("Authentication failed");
    }
  };

  const logout = () => {
    resetAnalyticsUser();
    localStorage.removeItem("onlyjobs_token");
    localStorage.removeItem("onlyjobs_user_id");
    setToken(null);
    setUserId(null);
    setIsLoggedIn(false);
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("onlyjobs_token");
    const storedUserId = localStorage.getItem("onlyjobs_user_id");

    if (storedToken && storedUserId) {
      setToken(storedToken);
      setUserId(storedUserId);
      setIsLoggedIn(true);
      identifyUser(storedUserId);
      void syncPersonProperties(getUserProfile);
    }
    setIsReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleExpired = () => {
      resetAnalyticsUser();
      setToken(null);
      setUserId(null);
      setIsLoggedIn(false);
    };
    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, []);

  return (
    <AuthContext.Provider
      value={{ userId, token, authenticate, logout, isLoggedIn, isReady }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
