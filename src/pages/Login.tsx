import { useState } from "react";
import { useAuth } from "../lib/auth";
import { useStore } from "../lib/store";
import { Store } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const { reloadAll } = useStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      await reloadAll();
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="card-pad w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-brand-600 flex items-center justify-center text-white"><Store size={22} /></div>
          <div>
            <div className="font-bold text-xl">AutoStock</div>
            <div className="text-sm text-slate-500">Iniciar sesión</div>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div><label className="label">Usuario</label><input className="input" value={username} onChange={(e)=>setUsername(e.target.value)} autoFocus /></div>
          <div><label className="label">Contraseña</label><input type="password" className="input" value={password} onChange={(e)=>setPassword(e.target.value)} /></div>
          {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
          <button className="btn-primary w-full" disabled={loading}>{loading ? "Ingresando..." : "Ingresar"}</button>
        </form>
        <div className="mt-4 text-xs text-slate-400">
          Demo: gerente / 12345 · cajero / 54321
        </div>
      </div>
    </div>
  );
}