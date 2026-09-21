import { createContext, useContext, useEffect, useState, useMemo, useCallback, type ReactNode } from "react";
import { authApi, getToken, setToken, type AuthUser } from "./api";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    role: "client" | "agency";
    company: string;
    country?: string;
  }) => Promise<{ requiresOtp: boolean }>;
  verifyRegister: (email: string, otp: string) => Promise<void>;
  loginWithGoogle: (credential: string, role?: "client" | "agency") => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;
    
    // Identify session on startup by calling /auth/me
    authApi
      .me()
      .then((r) => {
        setUser(r.user);
        // /auth/me doesn't return a token, token is already stored from login
      })
      .catch(() => {
        setUser(null);
        setToken(null);
      })
      .finally(() => {
        setLoading(false);
        setInitialized(true);
      });
  }, [initialized]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("auth-unauthorized", handleUnauthorized);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("auth-unauthorized", handleUnauthorized);
      }
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const r = await authApi.login({ email, password });
    setToken(r.token);
    setUser(r.user);
  }, []);

  const register = useCallback(async (data: {
    email: string;
    password: string;
    name: string;
    role: "client" | "agency";
    company: string;
    country?: string;
  }) => {
    const r = await authApi.register(data);
    return { requiresOtp: r.requiresOtp };
  }, []);

  const verifyRegister = useCallback(async (email: string, otp: string) => {
    const r = await authApi.verifyRegister({ email, otp });
    setToken(r.token);
    setUser(r.user);
  }, []);

  const loginWithGoogle = useCallback(async (credential: string, role?: "client" | "agency") => {
    const r = await authApi.google({ credential, role });
    setToken(r.token);
    setUser(r.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      setToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    initialized,
    login,
    register,
    verifyRegister,
    loginWithGoogle,
    logout,
  }), [user, loading, initialized, login, register, verifyRegister, loginWithGoogle, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}