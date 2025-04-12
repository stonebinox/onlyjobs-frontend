import { useApi } from "@/hooks/useApi";
import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextProps {
  userId: string | null;
  token: string | null;
  authenticate: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const { authenticateUser } = useApi();

  const authenticate = async (email: string, password: string) => {
    const response = await authenticateUser(email, password);

    if (response.token && response.id) {
      localStorage.setItem("onlyjobs_token", response.token);
      localStorage.setItem("onlyjobs_user_id", response.id);
      setToken(response.token);
      setUserId(response.id);
      setIsLoggedIn(true);
    } else {
      console.error(response.error);
      throw new Error("Authentication failed");
    }
  };

  const logout = () => {
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
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ userId, token, authenticate, logout, isLoggedIn }}
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
