import React, { createContext, useContext, useState, useEffect } from "react";

interface AuthUser { id: string; username: string; role: "gerente" | "cajero"; name: string; }
interface AuthValue { user: AuthUser | null; loading: boolean; login: (u: string, p: string) => Promise<void>; logout: () => void; }

const USERS_KEY = "autostock_users";
const TOKEN_KEY = "autostock_token";

const Ctx = createContext<AuthValue | null>(null);

function seedUsers() {
  if (localStorage.getItem(USERS_KEY)) return;
  const now = new Date().toISOString();
  const users = [
    { id: "u1", username: "gerente", password: "12345", role: "gerente", name: "Gerente General", createdAt: now },
    { id: "u2", username: "cajero", password: "54321", role: "cajero", name: "Cajero Principal", createdAt: now },
  ];
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  seedUsers();
  useEffect(() => {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (raw) {
      try { setUser(JSON.parse(raw)); } catch { localStorage.removeItem(TOKEN_KEY); }
    }
    setLoading(false);
  }, []);
  async function login(username: string, password: string) {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    const u = users.find((x: any) => x.username === username && x.password === password);
    if (!u) throw new Error("Credenciales inválidas");
    const sess = { id: u.id, username: u.username, role: u.role, name: u.name };
    localStorage.setItem(TOKEN_KEY, JSON.stringify(sess));
    setUser(sess);
  }
  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }
  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside provider");
  return v;
}