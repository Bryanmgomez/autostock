import React, { createContext, useContext, useState, useEffect } from "react";
import { api, setToken, getToken } from "./api";

interface AuthUser { id: string; username: string; role: "gerente" | "cajero"; name: string; }
interface AuthValue {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = getToken();
    if (!t) { setLoading(false); return; }
    api("/auth/me").then((r: any) => setUser(r.user)).catch(() => { setToken(null); setUser(null); }).finally(() => setLoading(false));
  }, []);

  async function login(username: string, password: string) {
    const r: any = await api("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
    setToken(r.token);
    setUser(r.user);
  }
  function logout() {
    setToken(null);
    setUser(null);
  }

  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside provider");
  return v;
}