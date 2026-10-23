import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { TOKEN_KEY, api, setUnauthorizedHandler } from "../lib/api";
import type { Account, Role } from "../lib/types";

interface AuthValue {
  user: Account | null;
  // True until the stored session has been verified with the server.
  checking: boolean;
  signIn: (email: string, password: string, role: Role) => Promise<Account>;
  register: (data: { fullName: string; email: string; password: string; phone: string }) => Promise<Account>;
  signOut: () => Promise<void>;
  updateUser: (user: Account) => void;
  setSession: (token: string, user: Account) => void;
}

const AuthContext = createContext<AuthValue | null>(null);

// The token is kept in localStorage and sent as a bearer header. The API and
// frontend are on different domains (Render / Vercel), which rules out simple
// SameSite cookies; tokens are short-lived (1 day) and revocable server-side.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Account | null>(null);
  const [checking, setChecking] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)));

  const clear = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(clear);
    if (!localStorage.getItem(TOKEN_KEY)) return;

    api
      .get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => clear())
      .finally(() => setChecking(false));
  }, [clear]);

  const setSession = useCallback((token: string, account: Account) => {
    localStorage.setItem(TOKEN_KEY, token);
    setUser(account);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string, role: Role) => {
      const res = await api.post("/auth/login", { email, password, role });
      setSession(res.data.token, res.data.user);
      return res.data.user as Account;
    },
    [setSession]
  );

  const register = useCallback(
    async (data: { fullName: string; email: string; password: string; phone: string }) => {
      const res = await api.post("/auth/register", data);
      setSession(res.data.token, res.data.user);
      return res.data.user as Account;
    },
    [setSession]
  );

  const signOut = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Clear the local session even if the server is unreachable.
    }
    clear();
  }, [clear]);

  const value = useMemo(
    () => ({ user, checking, signIn, register, signOut, updateUser: setUser, setSession }),
    [user, checking, signIn, register, signOut, setSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
