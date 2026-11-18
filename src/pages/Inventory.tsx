import { useState } from "react";
import { useStore } from "../lib/store";
import { money } from "../lib/storage";
import { CATEGORIES } from "../lib/types";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import Modal from "../components/Modal";

const empty = { name: "", sku: "", category: "Papelería", price: 0, cost: 0, stock: 0, minStock: 5, description: "" };

export default function Inventory() {
  const { products, addProduct, updateProduct, deleteProduct } = useStore();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Todos");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<any>(empty);

  const filtered = products.filter((p) => {
    const matchQ = p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase());
    const matchC = cat === "Todos" || p.category === cat;
    return matchQ && matchC;
  });

  function openNew() { setEditing(null); setForm(empty); setOpen(true); }
  function openEdit(p: any) { setEditing(p.id); setForm({ ...p }); setOpen(true); }
  async function save() {
    if (!form.name.trim()) { alert("El nombre es obligatorio"); return; }
    try {
      if (editing) await updateProduct({ ...form, id: editing });
      else await addProduct(form);
      setOpen(false);
    } catch (e: any) { alert(e.message); }
  }
  async function remove(id: string) {
    if (confirm("¿Eliminar este producto?")) {
      try { await deleteProduct(id); } catch (e: any) { alert(e.message); }
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventario</h1>
          <p className="text-slate-500 text-sm">{products.length} productos registrados</p>
        </div>
        <button className="btn-primary" onClick={openNew}><Plus size={16} /> Nuevo producto</button>
      </div>

      <div className="card-pad !p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Buscar por nombre o SKU..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input sm:w-48" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option>Todos</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="th">Producto</th><th className="th">SKU</th><th className="th">Categoría</th>
                <th className="th">Precio</th><th className="th">Costo</th><th className="th">Stock</th><th className="th">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td className="td text-center text-slate-400" colSpan={7}>No se encontraron productos</td></tr>
              )}
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td className="td">
                    <div className="font-medium text-slate-800">{p.name}</div>
                    <div className="text-xs text-slate-400">{p.description}</div>
                  </td>
                  <td className="td text-slate-500">{p.sku}</td>
                  <td className="td"><span className="badge bg-slate-100 text-slate-700">{p.category}</span></td>
                  <td className="td font-semibold">{money(p.price)}</td>
                  <td className="td text-slate-500">{money(p.cost)}</td>
                  <td className="td">
                    <span className={`badge ${p.stock <= p.minStock ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>{p.stock}</span>
                  </td>
                  <td className="td">
                    <div className="flex gap-1">
                      <button className="p-1.5 rounded hover:bg-slate-100 text-slate-600" onClick={() => openEdit(p)}><Pencil size={15} /></button>
                      <button className="p-1.5 rounded hover:bg-red-50 text-red-600" onClick={() => remove(p.id)}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Editar producto" : "Nuevo producto"} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label">Nombre *</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">SKU</label><input className="input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
          <div><label className="label">Categoría</label>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div><label className="label">Precio de venta</label><input type="number" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} /></div>
          <div><label className="label">Costo</label><input type="number" className="input" value={form.cost} onChange={(e) => setForm({ ...form, cost: +e.target.value })} /></div>
          <div><label className="label">Stock</label><input type="number" className="input" value={form.stock} onChange={(e) => setForm({ ...form, stock: +e.target.value })} /></div>
          <div><label className="label">Stock mínimo</label><input type="number" className="input" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: +e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="label">Descripción</label><textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button className="btn-secondary" onClick={() => setOpen(false)}>Cancelar</button>
          <button className="btn-primary" onClick={save}>Guardar</button>
        </div>
      </Modal>
    </div>
  );
}