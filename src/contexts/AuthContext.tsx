import { createApiClient } from "@/lib/apiClient";
import type { User } from "@/types/User";
import { createContext, useContext, useEffect, useState } from "react";
import { identifyUser, resetAnalyticsUser, setUserPersonProperties, trackEvent } from "@/utils/analytics";

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
      localStorage.setItem("onlyjobs_token", response.token);
      localStorage.setItem("onlyjobs_user_id", response.id);
      setToken(response.token);
      setUserId(response.id);
      setIsLoggedIn(true);
      identifyUser(response.id);
      void syncPersonProperties(getUserProfile);
      if (response.isNewUser) {
        trackEvent("signup_complete");
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
