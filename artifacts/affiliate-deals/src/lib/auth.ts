import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { createElement } from "react";

export interface AuthUser {
  id: number;
  email: string;
  username: string;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const fetchMe = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) return await res.json();
      return null;
    } catch {
      return null;
    }
  }, []);

  const refresh = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
      if (!res.ok) return false;
      const user = await fetchMe();
      if (user) {
        setState({ user, isLoading: false, isAuthenticated: true });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [fetchMe]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const user = await fetchMe();
      if (cancelled) return;
      if (user) {
        setState({ user, isLoading: false, isAuthenticated: true });
      } else {
        const ok = await refresh();
        if (!cancelled && !ok) {
          setState({ user: null, isLoading: false, isAuthenticated: false });
        }
      }
    })();
    return () => { cancelled = true; };
  }, [fetchMe, refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Login failed");
    }
    const data = await res.json();
    setState({ user: data.user, isLoading: false, isAuthenticated: true });
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setState({ user: null, isLoading: false, isAuthenticated: false });
  }, []);

  return createElement(AuthContext.Provider, { value: { ...state, login, logout, refresh } }, children);
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
