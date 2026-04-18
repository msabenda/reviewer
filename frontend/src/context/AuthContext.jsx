import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { getCurrentUser, loginUser, logoutUser, registerUser } from "../services/reviewerApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [csrfToken, setCsrfToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function hydrateSession() {
      setLoading(true);
      try {
        const session = await getCurrentUser();
        if (!cancelled) {
          setUser(session.user);
          setCsrfToken(session.csrf_token);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          setCsrfToken("");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    hydrateSession();

    return () => {
      cancelled = true;
    };
  }, []);

  async function register(payload) {
    setError("");
    const session = await registerUser(payload);
    // Registration should not auto-authenticate. We return the session payload so the caller
    // can clear any server-set cookies and route to login.
    return session;
  }

  async function login(payload) {
    setError("");
    const session = await loginUser(payload);
    setUser(session.user);
    setCsrfToken(session.csrf_token);
    return session.user;
  }

  async function logout() {
    try {
      if (csrfToken) {
        await logoutUser(csrfToken);
      }
    } catch {
      // Clear local session state even if the backend cookie is already gone.
    }

    setUser(null);
    setCsrfToken("");
    setError("");
  }

  function setAuthError(message) {
    setError(message || "");
  }

  const value = useMemo(
    () => ({
      user,
      csrfToken,
      loading,
      error,
      isAuthenticated: Boolean(user),
      register,
      login,
      logout,
      setAuthError,
    }),
    [user, csrfToken, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
}
