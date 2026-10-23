import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { api, clearToken, getToken, isRemembered, setUnauthorizedHandler, storeToken } from "../lib/api";
import type { Account, Role } from "../lib/types";

interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  phone: string;
}

interface AuthValue {
  user: Account | null;
  // True until the stored session has been verified with the server.
  checking: boolean;
  signIn: (email: string, password: string, role: Role, remember: boolean) => Promise<Account>;
  signInWithGoogle: (credential: string, remember: boolean) => Promise<Account>;
  register: (data: RegisterData, remember: boolean) => Promise<Account>;
  signOut: () => Promise<void>;
  updateUser: (user: Account) => void;
  /** Replaces the token, keeping the current "Keep me signed in" choice unless one is given. */
  setSession: (token: string, user: Account, remember?: boolean) => void;
}

const AuthContext = createContext<AuthValue | null>(null);

// The token is sent as a bearer header. The API and frontend are on different
// domains (Render / Vercel), which rules out simple SameSite cookies. Tokens
// are revocable server-side: 1 day normally, 30 days with "Keep me signed in".
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Account | null>(null);
  const [checking, setChecking] = useState(() => Boolean(getToken()));

  const clear = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(clear);
    if (!getToken()) return;

    api
      .get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => clear())
      .finally(() => setChecking(false));
  }, [clear]);

  const setSession = useCallback((token: string, account: Account, remember?: boolean) => {
    storeToken(token, remember ?? isRemembered());
    setUser(account);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string, role: Role, remember: boolean) => {
      const res = await api.post("/auth/login", { email, password, role, remember });
      setSession(res.data.token, res.data.user, remember);
      return res.data.user as Account;
    },
    [setSession]
  );

  const signInWithGoogle = useCallback(
    async (credential: string, remember: boolean) => {
      const res = await api.post("/auth/google", { credential, remember });
      setSession(res.data.token, res.data.user, remember);
      return res.data.user as Account;
    },
    [setSession]
  );

  const register = useCallback(
    async (data: RegisterData, remember: boolean) => {
      const res = await api.post("/auth/register", { ...data, remember });
      setSession(res.data.token, res.data.user, remember);
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
    () => ({ user, checking, signIn, signInWithGoogle, register, signOut, updateUser: setUser, setSession }),
    [user, checking, signIn, signInWithGoogle, register, signOut, setSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
