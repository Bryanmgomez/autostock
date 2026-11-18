import { useState } from "react";
import { useStore } from "../lib/store";
import { money, formatDate } from "../lib/storage";
import { Trash2, ArrowUpCircle, ArrowDownCircle, Lock, Unlock } from "lucide-react";
import Modal from "../components/Modal";

export default function Cash() {
  const { cash, cashSessions, addCash, deleteCash, openCash, closeCash } = useStore();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"in" | "out">("in");
  const [form, setForm] = useState({ amount: 0, description: "", category: "General" });
  const [openModal, setOpenModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [openingAmount, setOpeningAmount] = useState(0);
  const [closingAmount, setClosingAmount] = useState(0);


  const session = cashSessions.find((s: any) => s.status === "open") || null;
  const balance = cash.reduce((a: number, e: any) => a + (e.type === "in" ? e.amount : -e.amount), 0);
  const totalIn = cash.filter((e: any) => e.type === "in").reduce((a: number, e: any) => a + e.amount, 0);
  const totalOut = cash.filter((e: any) => e.type === "out").reduce((a: number, e: any) => a + e.amount, 0);

  async function saveEntry() {
    if (!form.description.trim() || form.amount <= 0) { alert("Completa descripción y monto"); return; }
    try {
      await addCash({ type, amount: form.amount, description: form.description, category: form.category });
      setOpen(false);
      setForm({ amount: 0, description: "", category: "General" });
    } catch (e: any) { alert(e.message); }
  }
  async function doOpen() {
    try {
      await openCash(openingAmount);
      setOpenModal(false);
      setOpeningAmount(0);
    } catch (e: any) { alert(e.message); }
  }
  async function doClose() {
    if (!session) { alert("No hay caja abierta"); return; }
    try {
      const r: any = await closeCash(session.id, closingAmount);
      alert(`Caja cerrada. Esperado: ${money(r.expected)} · Contado: ${money(r.closing)} · Diferencia: ${money(r.difference)}`);
      setCloseModal(false);
      setClosingAmount(0);
    } catch (e: any) { alert(e.message); }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Caja</h1>
          <p className="text-slate-500 text-sm">Control de ingresos y egresos</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {!session ? (
            <button className="btn-primary" onClick={() => setOpenModal(true)}><Unlock size={16} /> Abrir caja</button>
          ) : (
            <button className="btn-danger" onClick={() => setCloseModal(true)}><Lock size={16} /> Cerrar caja</button>
          )}
          <button className="btn-primary" onClick={() => { setType("in"); setOpen(true); }}><ArrowUpCircle size={16} /> Ingreso</button>
          <button className="btn-danger" onClick={() => { setType("out"); setOpen(true); }}><ArrowDownCircle size={16} /> Egreso</button>
        </div>
      </div>

      {session && (
        <div className="card-pad bg-blue-50 border-blue-200 text-sm">
          Caja abierta desde {formatDate(session.openedAt)} · Monto inicial: {money(session.openingAmount)}
        </div>
      )}

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
              {cash.map((e: any) => (
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
                    <button className="text-red-500 hover:text-red-700" onClick={async () => { if (confirm("¿Eliminar movimiento?")) { try { await deleteCash(e.id); } catch (err: any) { alert(err.message); } } }}><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* cierre history */}
      <div className="card-pad">
        <h3 className="font-semibold text-slate-800 mb-3">Historial de cierres</h3>
        {cashSessions.filter((s: any) => s.status === "closed").length === 0 ? (
          <p className="text-sm text-slate-400">Sin cierres registrados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th className="th">Apertura</th><th className="th">Cierre</th><th className="th">Inicial</th><th className="th">Esperado</th><th className="th">Contado</th><th className="th">Diferencia</th></tr></thead>
              <tbody>
                {cashSessions.filter((s: any) => s.status === "closed").map((s: any) => (
                  <tr key={s.id}>
                    <td className="td text-xs">{formatDate(s.openedAt)}</td>
                    <td className="td text-xs">{formatDate(s.closedAt)}</td>
                    <td className="td">{money(s.openingAmount)}</td>
                    <td className="td">{money(s.expectedAmount)}</td>
                    <td className="td">{money(s.closingAmount)}</td>
                    <td className={`td font-semibold ${s.difference === 0 ? "text-emerald-600" : "text-red-600"}`}>{money(s.difference)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
          <button className={type === "in" ? "btn-primary" : "btn-danger"} onClick={saveEntry}>Guardar</button>
        </div>
      </Modal>

      <Modal open={openModal} onClose={() => setOpenModal(false)} title="Abrir caja">
        <div className="space-y-4">
          <div><label className="label">Dinero inicial</label><input type="number" className="input" value={openingAmount} onChange={(e) => setOpeningAmount(+e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button className="btn-secondary" onClick={() => setOpenModal(false)}>Cancelar</button>
          <button className="btn-primary" onClick={doOpen}>Abrir</button>
        </div>
      </Modal>

      <Modal open={closeModal} onClose={() => setCloseModal(false)} title="Cerrar caja">
        <div className="space-y-4">
          <div><label className="label">Dinero contado</label><input type="number" className="input" value={closingAmount} onChange={(e) => setClosingAmount(+e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button className="btn-secondary" onClick={() => setCloseModal(false)}>Cancelar</button>
          <button className="btn-danger" onClick={doClose}>Cerrar caja</button>
        </div>
      </Modal>
    </div>
  );
}