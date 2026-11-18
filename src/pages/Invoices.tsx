import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { useStore } from "../lib/store";
import { money, formatDate } from "../lib/storage";
import { Eye, Printer } from "lucide-react";
import Modal from "../components/Modal";

export default function Invoices() {
  const { sales } = useStore();
  const [selected, setSelected] = useState<any>(null);
  const [qr, setQr] = useState<string>("");

  useEffect(() => {
    if (!selected) { setQr(""); return; }
    const text = `AutoStock Factura ${selected.id.slice(-6).toUpperCase()} | Cliente: ${selected.customerName || "Cliente general"} | Total: ${selected.total} | Fecha: ${selected.date}`;
    QRCode.toDataURL(text, { width: 180, margin: 1 }).then(setQr).catch(() => setQr(""));
  }, [selected]);

  function printInvoice() {
    window.print();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Facturación</h1>
        <p className="text-slate-500 text-sm">Comprobantes de venta</p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr><th className="th">Nº</th><th className="th">Fecha</th><th className="th">Cliente</th><th className="th">Items</th><th className="th">Total</th><th className="th">Método</th><th className="th">Acciones</th></tr>
            </thead>
            <tbody>
              {sales.length === 0 && <tr><td className="td text-center text-slate-400" colSpan={7}>Sin ventas</td></tr>}
              {sales.map((s) => (
                <tr key={s.id}>
                  <td className="td font-mono text-xs">{s.id.slice(-6).toUpperCase()}</td>
                  <td className="td text-slate-500">{formatDate(s.date)}</td>
                  <td className="td">{s.customerName || "Cliente general"}</td>
                  <td className="td">{s.items.length}</td>
                  <td className="td font-semibold">{money(s.total)}</td>
                  <td className="td"><span className="badge bg-slate-100 text-slate-700">{s.paymentMethod}</span></td>
                  <td className="td">
                    <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => setSelected(s)}><Eye size={14} /> Ver</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Comprobante de venta" size="lg">
        {selected && (
          <div>
            <div id="invoice" className="space-y-4">
              <div className="text-center border-b border-slate-200 pb-4">
                <div className="text-xl font-bold text-slate-800">AutoStock</div>
                <div className="text-sm text-slate-500">Papelería & Variedades</div>
                <div className="text-xs text-slate-400 mt-1">NIT: 900.123.456-7 · Tel: (604) 123-4567</div>
                <div className="text-xs text-slate-400">Calle 10 #5-20, Medellín, Colombia</div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-slate-500">Factura Nº:</span> <span className="font-mono font-semibold">{selected.id.slice(-6).toUpperCase()}</span></div>
                <div><span className="text-slate-500">Fecha:</span> {formatDate(selected.date)}</div>
                <div><span className="text-slate-500">Cliente:</span> {selected.customerName || "Cliente general"}</div>
                <div><span className="text-slate-500">Método:</span> {selected.paymentMethod}</div>
              </div>
              <table className="table mt-2">
                <thead>
                  <tr><th className="th">Producto</th><th className="th">Cant.</th><th className="th">Precio</th><th className="th">Subtotal</th></tr>
                </thead>
                <tbody>
                  {selected.items.map((it: any, i: number) => (
                    <tr key={i}>
                      <td className="td">{it.name}</td>
                      <td className="td">{it.qty}</td>
                      <td className="td">{money(it.price)}</td>
                      <td className="td">{money(it.price * it.qty - it.discount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-right space-y-1 text-sm border-t border-slate-200 pt-3">
                <div className="flex justify-end gap-8"><span className="text-slate-500">Subtotal</span><span>{money(selected.subtotal)}</span></div>
                <div className="flex justify-end gap-8"><span className="text-slate-500">Descuento</span><span>-{money(selected.discount)}</span></div>
                <div className="flex justify-end gap-8 font-bold text-lg"><span>Total</span><span className="text-brand-600">{money(selected.total)}</span></div>
              </div>
              {selected.notes && <div className="text-xs text-slate-500 mt-2">Notas: {selected.notes}</div>}
              {qr && (
                <div className="flex flex-col items-center mt-4 gap-2">
                  <img src={qr} alt="QR de la compra" className="border border-slate-200 rounded" />
                  <a href={qr} download={`factura-${selected.id.slice(-6)}.png`} className="btn-secondary !px-2 !py-1 text-xs">Descargar QR</a>
                </div>
              )}
              <div className="text-center text-xs text-slate-400 mt-4">Gracias por su compra</div>
            </div>
            <div className="flex justify-end gap-2 mt-5 no-print">
              <button className="btn-secondary" onClick={() => setSelected(null)}>Cerrar</button>
              <button className="btn-primary" onClick={printInvoice}><Printer size={16} /> Imprimir</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}