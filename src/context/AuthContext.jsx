import { createContext, useContext, useState, useCallback, useEffect } from "react";
import api, { setUnauthorizedHandler } from "../services/api";

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("token") || localStorage.getItem("token");
  });
  const [user, setUser] = useState(() => {
    try {
      const raw = sessionStorage.getItem("user") || localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const setToken = useCallback((t, persist = false) => {
    setTokenState(t);
    if (typeof window === "undefined") return;
    window.__authToken = t || undefined;
    if (t) {
      sessionStorage.setItem("token", t);
      if (persist) localStorage.setItem("token", t);
    } else {
      sessionStorage.removeItem("token");
      localStorage.removeItem("token");
    }
  }, []);

  const setUserAndPersist = useCallback((u, persist = false) => {
    setUser(u);
    if (typeof window === "undefined") return;
    if (u) {
      const raw = JSON.stringify(u);
      sessionStorage.setItem("user", raw);
      if (persist) localStorage.setItem("user", raw);
    } else {
      sessionStorage.removeItem("user");
      localStorage.removeItem("user");
    }
  }, []);

  const login = useCallback(
    async (username, password) => {
      const { data } = await api.post("/api/v1/auth/login", { username, password });
      const t = data?.token ?? data?.data?.token;
      const u = data?.user ?? data?.data?.user;
      if (!t || !u) throw new Error(data?.error || "Invalid response");
      setToken(t, true);
      setUserAndPersist(
        {
          id: String(u.id),
          name: u.username,
          email: u.email ?? "",
          role: u.role ?? "developer",
        },
        true
      );
      return { user: u, token: t };
    },
    [setToken, setUserAndPersist]
  );

  const logout = useCallback(() => {
    setToken(null);
    setUserAndPersist(null);
  }, [setToken, setUserAndPersist]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null);
      setUserAndPersist(null);
      window.location.href = "/login";
    });
  }, [setToken, setUserAndPersist]);

  const value = {
    token,
    user,
    login,
    logout,
    setToken,
    isAuthenticated: !!token,
  };

  if (typeof window !== "undefined" && token) {
    window.__authToken = token;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
