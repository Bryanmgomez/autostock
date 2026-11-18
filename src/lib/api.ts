const BASE = (import.meta as any).env?.VITE_API_URL || "/api";

export function getToken(): string | null { return localStorage.getItem("autostock_token"); }
export function setToken(t: string | null) {
  if (t) localStorage.setItem("autostock_token", t); else localStorage.removeItem("autostock_token");
}

export async function api(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(options.headers as any) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(BASE + path, { ...options, headers });
  if (!res.ok) {
    let msg = res.statusText;
    try { const j = await res.json(); msg = j.error || msg; } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}