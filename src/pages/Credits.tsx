import { useState } from "react";
import { useStore } from "../lib/store";
import { money, formatDate } from "../lib/storage";
import { Plus, User } from "lucide-react";
import Modal from "../components/Modal";

export default function Credits() {
  const { sales, customers, creditPayments, addCreditPayment } = useStore();
  const [paying, setPaying] = useState<any>(null);
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState("");

  const creditSales = sales.filter((s) => s.credit);

  function paidFor(saleId: string) {
    return creditPayments.filter((p) => p.saleId === saleId).reduce((a, p) => a + p.amount, 0) + (sales.find((s) => s.id === saleId)?.paid || 0);
  }
  function debtOf(sale: any) {
    return Math.max(0, sale.total - paidFor(sale.id));
  }

  // group by customer
  const byCustomer = new Map<string, any[]>();
  creditSales.forEach((s) => {
    const key = s.customerId || "general";
    if (!byCustomer.has(key)) byCustomer.set(key, []);
    byCustomer.get(key)!.push(s);
  });

  function openPay(sale: any) {
    setPaying(sale);
    setAmount(debtOf(sale));
    setNote("");
  }
  function savePay() {
    if (!paying || amount <= 0) { alert("Monto inválido"); return; }
    const d = debtOf(paying);
    if (amount > d + 0.01) { alert("El monto supera la deuda"); return; }
    addCreditPayment({ saleId: paying.id, amount, note });
    setPaying(null);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Créditos</h1>
        <p className="text-slate-500 text-sm">Ventas a crédito y abonos</p>
      </div>

      {creditSales.length === 0 && (
        <div className="card-pad text-center text-slate-400">No hay ventas a crédito registradas.</div>
      )}

      {Array.from(byCustomer.entries()).map(([custId, list]) => {
        const cust = customers.find((c) => c.id === custId);
        const name = cust?.name || (custId === "general" ? "Cliente general" : custId);
        const totalDebt = list.reduce((a, s) => a + debtOf(s), 0);
        return (
          <div key={custId} className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <User size={18} className="text-slate-500" />
                <div>
                  <div className="font-semibold text-slate-800">{name}</div>
                  <div className="text-xs text-slate-500">{list.length} venta(s) a crédito</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500">Deuda total</div>
                <div className={`font-bold ${totalDebt > 0 ? "text-red-600" : "text-emerald-600"}`}>{money(totalDebt)}</div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr><th className="th">Factura</th><th className="th">Fecha</th><th className="th">Total</th><th className="th">Abonado</th><th className="th">Saldo</th><th className="th">Estado</th><th className="th"></th></tr>
                </thead>
                <tbody>
                  {list.map((s) => {
                    const paid = paidFor(s.id);
                    const debt = debtOf(s);
                    return (
                      <tr key={s.id}>
                        <td className="td font-mono text-xs">{s.id.slice(-6).toUpperCase()}</td>
                        <td className="td text-slate-500">{formatDate(s.date)}</td>
                        <td className="td">{money(s.total)}</td>
                        <td className="td text-emerald-600">{money(paid)}</td>
                        <td className="td font-semibold text-red-600">{money(debt)}</td>
                        <td className="td">
                          <span className={`badge ${debt <= 0 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                            {debt <= 0 ? "Pagado" : "Pendiente"}
                          </span>
                        </td>
                        <td className="td">
                          {debt > 0 && (
                            <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => openPay(s)}><Plus size={14} /> Abono</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* payments history */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
              <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Historial de abonos</div>
              {list.flatMap((s) => creditPayments.filter((p) => p.saleId === s.id)).length === 0 ? (
                <div className="text-xs text-slate-400">Sin abonos</div>
              ) : (
                <ul className="space-y-1">
                  {list.flatMap((s) => creditPayments.filter((p) => p.saleId === s.id)).map((p) => (
                    <li key={p.id} className="text-xs flex justify-between text-slate-600">
                      <span>{formatDate(p.date)} · {p.note || "Abono"}</span>
                      <span className="font-semibold text-emerald-600">{money(p.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );
      })}

      <Modal open={!!paying} onClose={() => setPaying(null)} title="Registrar abono">
        {paying && (
          <div className="space-y-4">
            <div className="text-sm text-slate-600">
              Factura {paying.id.slice(-6).toUpperCase()} · Saldo: <span className="font-semibold text-red-600">{money(debtOf(paying))}</span>
            </div>
            <div><label className="label">Monto</label><input type="number" className="input" value={amount} onChange={(e) => setAmount(+e.target.value)} /></div>
            <div><label className="label">Nota</label><input className="input" value={note} onChange={(e) => setNote(e.target.value)} /></div>
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setPaying(null)}>Cancelar</button>
              <button className="btn-primary" onClick={savePay}>Registrar abono</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}