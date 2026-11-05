import { useState } from "react";
import { useStore } from "../lib/store";
import { money, formatDate } from "../lib/storage";
import { Trash2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import Modal from "../components/Modal";

export default function Cash() {
  const { cash, addCash, deleteCash } = useStore();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"in" | "out">("in");
  const [form, setForm] = useState({ amount: 0, description: "", category: "General" });

  const balance = cash.reduce((a, e) => a + (e.type === "in" ? e.amount : -e.amount), 0);
  const totalIn = cash.filter((e) => e.type === "in").reduce((a, e) => a + e.amount, 0);
  const totalOut = cash.filter((e) => e.type === "out").reduce((a, e) => a + e.amount, 0);

  function save() {
    if (!form.description.trim() || form.amount <= 0) { alert("Completa descripción y monto"); return; }
    addCash({ type, amount: form.amount, description: form.description, category: form.category });
    setOpen(false);
    setForm({ amount: 0, description: "", category: "General" });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Caja</h1>
          <p className="text-slate-500 text-sm">Control de ingresos y egresos</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-primary" onClick={() => { setType("in"); setOpen(true); }}><ArrowUpCircle size={16} /> Ingreso</button>
          <button className="btn-danger" onClick={() => { setType("out"); setOpen(true); }}><ArrowDownCircle size={16} /> Egreso</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-pad">
          <div className="text-xs font-semibold text-slate-500 uppercase">Saldo actual</div>
          <div className={`text-2xl font-bold mt-1 ${balance >= 0 ? "text-emerald-600" : "text-red-600"}`}>{money(balance)}</div>
        </div>
        <div className="card-pad">
          <div className="text-xs font-semibold text-slate-500 uppercase">Total ingresos</div>
          <div className="text-2xl font-bold mt-1 text-emerald-600">{money(totalIn)}</div>
        </div>
        <div className="card-pad">
          <div className="text-xs font-semibold text-slate-500 uppercase">Total egresos</div>
          <div className="text-2xl font-bold mt-1 text-red-600">{money(totalOut)}</div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr><th className="th">Fecha</th><th className="th">Tipo</th><th className="th">Descripción</th><th className="th">Categoría</th><th className="th">Monto</th><th className="th"></th></tr>
            </thead>
            <tbody>
              {cash.length === 0 && <tr><td className="td text-center text-slate-400" colSpan={6}>Sin movimientos</td></tr>}
              {cash.map((e) => (
                <tr key={e.id}>
                  <td className="td text-slate-500 text-xs">{formatDate(e.date)}</td>
                  <td className="td">
                    <span className={`badge ${e.type === "in" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                      {e.type === "in" ? "Ingreso" : "Egreso"}
                    </span>
                  </td>
                  <td className="td">{e.description}</td>
                  <td className="td text-slate-500">{e.category}</td>
                  <td className={`td font-semibold ${e.type === "in" ? "text-emerald-600" : "text-red-600"}`}>
                    {e.type === "in" ? "+" : "-"}{money(e.amount)}
                  </td>
                  <td className="td">
                    <button className="text-red-500 hover:text-red-700" onClick={() => { if (confirm("¿Eliminar movimiento?")) deleteCash(e.id); }}><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={type === "in" ? "Registrar ingreso" : "Registrar egreso"}>
        <div className="space-y-4">
          <div><label className="label">Monto</label><input type="number" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: +e.target.value })} /></div>
          <div><label className="label">Descripción</label><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div><label className="label">Categoría</label>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option>General</option><option>Arriendo</option><option>Servicios</option><option>Proveedores</option><option>Nómina</option><option>Otros</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button className="btn-secondary" onClick={() => setOpen(false)}>Cancelar</button>
          <button className={type === "in" ? "btn-primary" : "btn-danger"} onClick={save}>Guardar</button>
        </div>
      </Modal>
    </div>
  );
}