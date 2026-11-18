import { useState } from "react";
import { useStore } from "../lib/store";
import { money } from "../lib/storage";
import { Plus, Trash2, Search, ShoppingCart } from "lucide-react";

interface CartItem { productId: string; name: string; price: number; iva: number; qty: number; discount: number; }

export default function Sales() {
  const { products, customers, addSale } = useStore();
  const [customerId, setCustomerId] = useState<string>("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomer, setShowCustomer] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [prodSearch, setProdSearch] = useState("");
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  const [paid, setPaid] = useState(0);
  const [notes, setNotes] = useState("");
  const [showProd, setShowProd] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const customer = customers.find((c: any) => c.id === customerId);
  const subtotal = cart.reduce((a, i) => a + i.price * i.qty, 0);
  const itemDiscountTotal = cart.reduce((a, i) => a + i.discount, 0);
  const netAfterItem = subtotal - itemDiscountTotal;
  const ivaTotal = cart.reduce((a, i) => a + (i.price * i.qty - i.discount) * (i.iva / 100), 0);
  const total = Math.max(0, netAfterItem - discount) + ivaTotal;
  const paidFinal = paymentMethod === "credito" ? (paid > 0 ? paid : 0) : (paid > 0 ? paid : total);
  const missing = Math.max(0, total - (paymentMethod === "credito" ? 0 : paidFinal));
  const change = Math.max(0, paidFinal - total);

  const filteredProds = products.filter((p: any) =>
    p.name.toLowerCase().includes(prodSearch.toLowerCase()) || (p.sku || "").toLowerCase().includes(prodSearch.toLowerCase())
  );

  function addToCart(p: any) {
    setCart((prev) => {
      const ex = prev.find((i) => i.productId === p.id);
      if (ex) return prev.map((i) => i.productId === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { productId: p.id, name: p.name, price: p.price, iva: p.iva || 0, qty: 1, discount: 0 }];
    });
    setShowProd(false);
    setProdSearch("");
  }
  function updateQty(id: string, qty: number) { setCart((prev) => prev.map((i) => i.productId === id ? { ...i, qty: Math.max(1, qty) } : i)); }
  function updateLineDiscount(id: string, d: number) {
    setCart((prev) => prev.map((i) => i.productId === id ? { ...i, discount: Math.max(0, Math.min(i.price * i.qty, d)) } : i));
  }
  function removeItem(id: string) { setCart((prev) => prev.filter((i) => i.productId !== id)); }

  async function submit() {
    if (cart.length === 0) { alert("Agrega al menos un producto"); return; }
    for (const it of cart) {
      const p = products.find((x: any) => x.id === it.productId);
      if (!p || p.stock < it.qty) { alert(`Stock insuficiente para ${it.name}`); return; }
    }
    if (discount < 0 || discount > netAfterItem) { alert("Descuento global inválido"); return; }
    if (paymentMethod !== "credito" && paid > 0 && paid < total) {
      alert(`Faltan ${money(total - paid)}. No se puede finalizar como pagada.`); return;
    }
    setSubmitting(true);
    try {
      const sale = await addSale({
        customerId: customerId || null,
        customerName: customer?.name ? `${customer.name} ${customer.lastName || ""}`.trim() : "Cliente general",
        items: cart.map((i) => ({ productId: i.productId, name: i.name, qty: i.qty, price: i.price, iva: i.iva, discount: i.discount })),
        discount,
        total,
        paymentMethod,
        paid: paymentMethod === "credito" ? paid : (paid > 0 ? paid : total),
        credit: paymentMethod === "credito",
        notes,
      });
      setLastSale(sale);
      setCart([]); setDiscount(0); setPaid(0); setNotes(""); setCustomerId("");
    } catch (e: any) { alert(e.message); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Registrar venta</h1>
        <p className="text-slate-500 text-sm">Selecciona productos y completa la venta</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="card-pad !p-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="input pl-9" placeholder="Buscar producto para agregar..." value={prodSearch}
                  onChange={(e) => { setProdSearch(e.target.value); setShowProd(true); }}
                  onFocus={() => setShowProd(true)} />
              </div>
              <button className="btn-secondary" onClick={() => setShowProd(!showProd)}><Plus size={16} /></button>
            </div>
            {showProd && (
              <div className="mt-2 max-h-56 overflow-auto border border-slate-200 rounded-lg">
                {filteredProds.map((p: any) => (
                  <button key={p.id} onClick={() => addToCart(p)}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between border-b border-slate-100 last:border-0">
                    <div>
                      <div className="text-sm font-medium">{p.name}</div>
                      <div className="text-xs text-slate-400">{p.sku} · Stock: {p.stock} · IVA {p.iva}%</div>
                    </div>
                    <div className="text-sm font-semibold text-brand-600">{money(p.price)}</div>
                  </button>
                ))}
                {filteredProds.length === 0 && <div className="px-3 py-4 text-sm text-slate-400 text-center">Sin resultados</div>}
              </div>
            )}
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr><th className="th">Producto</th><th className="th">Precio</th><th className="th">IVA</th><th className="th">Cant.</th><th className="th">Desc. línea</th><th className="th">Subtotal</th><th className="th"></th></tr>
                </thead>
                <tbody>
                  {cart.length === 0 && <tr><td className="td text-center text-slate-400" colSpan={7}>Carrito vacío</td></tr>}
                  {cart.map((i) => (
                    <tr key={i.productId}>
                      <td className="td font-medium">{i.name}</td>
                      <td className="td">{money(i.price)}</td>
                      <td className="td">{i.iva}%</td>
                      <td className="td"><input type="number" min={1} className="input !w-16 !py-1" value={i.qty} onChange={(e) => updateQty(i.productId, +e.target.value)} /></td>
                      <td className="td"><input type="number" min={0} className="input !w-20 !py-1" value={i.discount} onChange={(e) => updateLineDiscount(i.productId, +e.target.value)} /></td>
                      <td className="td font-semibold">{money(i.price * i.qty - i.discount + (i.price * i.qty - i.discount) * (i.iva/100))}</td>
                      <td className="td"><button className="text-red-500 hover:text-red-700" onClick={() => removeItem(i.productId)}><Trash2 size={15} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card-pad space-y-4">
            <div className="relative">
              <label className="label">Cliente (buscar)</label>
              <input className="input" placeholder="Buscar por nombre, apellido o documento..."
                value={customerId ? (customers.find((c:any)=>c.id===customerId)?.name + " " + (customers.find((c:any)=>c.id===customerId)?.lastName||"")) : customerSearch}
                onChange={(e) => { setCustomerId(""); setCustomerSearch(e.target.value); setShowCustomer(true); }}
                onFocus={() => setShowCustomer(true)} />
              {showCustomer && (
                <div className="absolute z-10 mt-1 w-full max-h-48 overflow-auto border border-slate-200 rounded-lg bg-white shadow">
                  <button className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm" onClick={() => { setCustomerId(""); setCustomerSearch(""); setShowCustomer(false); }}>
                    Cliente general
                  </button>
                  {customers.filter((c:any) => {
                    const q = customerSearch.toLowerCase();
                    return !q || `${c.name} ${c.lastName||""} ${c.document}`.toLowerCase().includes(q);
                  }).map((c:any) => (
                    <button key={c.id} className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm border-t border-slate-100" onClick={() => { setCustomerId(c.id); setCustomerSearch(""); setShowCustomer(false); }}>
                      {c.name} {c.lastName || ""} <span className="text-slate-400 text-xs">({c.document})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="label">Método de pago</label>
              <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
                <option value="credito">Crédito</option>
              </select>
            </div>
            <div>
              <label className="label">Descuento global</label>
              <input type="number" min={0} className="input" value={discount} onChange={(e) => setDiscount(+e.target.value)} />
            </div>
            <div>
              <label className="label">Valor recibido</label>
              <input type="number" min={0} className="input" value={paid} onChange={(e) => setPaid(+e.target.value)} placeholder={String(total)} disabled={paymentMethod==="credito"} />
            </div>
            <div>
              <label className="label">Notas</label>
              <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <div className="border-t border-slate-200 pt-4 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{money(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Desc. productos</span><span>-{money(itemDiscountTotal)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Desc. global</span><span>-{money(discount)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">IVA</span><span>{money(ivaTotal)}</span></div>
              <div className="flex justify-between font-bold text-lg"><span>Total</span><span className="text-brand-600">{money(total)}</span></div>
              {paymentMethod !== "credito" && (
                <>
                  <div className="flex justify-between text-emerald-600"><span>Cambio</span><span>{money(change)}</span></div>
                  {missing > 0 && <div className="flex justify-between text-red-600 font-semibold"><span>Faltante</span><span>{money(missing)}</span></div>}
                </>
              )}
            </div>

            <button className="btn-primary w-full" onClick={submit} disabled={submitting}><ShoppingCart size={16} /> {submitting ? "Procesando..." : "Finalizar venta"}</button>
          </div>
        </div>
      </div>

      {lastSale && (
        <div className="card-pad bg-emerald-50 border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-emerald-800">Venta registrada correctamente</div>
              <div className="text-sm text-emerald-700">Total: {money(lastSale.total)} · ID: {String(lastSale.id).slice(-6)}</div>
            </div>
            <button className="btn-secondary" onClick={() => setLastSale(null)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}