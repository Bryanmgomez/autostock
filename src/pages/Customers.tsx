import { useState } from "react";
import { useStore } from "../lib/store";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import Modal from "../components/Modal";

const empty = { name: "", document: "", phone: "", email: "", address: "" };

export default function Customers() {
  const { customers, addCustomer, updateCustomer, deleteCustomer, sales } = useStore();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<any>(empty);

  const filtered = customers.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()) || c.document.includes(q) || c.phone.includes(q));

  function openNew() { setEditing(null); setForm(empty); setOpen(true); }
  function openEdit(c: any) { setEditing(c.id); setForm({ ...c }); setOpen(true); }
  function save() {
    if (!form.name.trim()) { alert("El nombre es obligatorio"); return; }
    if (editing) updateCustomer({ ...form, id: editing, createdAt: customers.find((c) => c.id === editing)!.createdAt });
    else addCustomer(form);
    setOpen(false);
  }
  function remove(id: string) {
    const hasSales = sales.some((s) => s.customerId === id);
    if (hasSales) { alert("No se puede eliminar: el cliente tiene ventas registradas."); return; }
    if (confirm("¿Eliminar este cliente?")) deleteCustomer(id);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
          <p className="text-slate-500 text-sm">{customers.length} clientes registrados</p>
        </div>
        <button className="btn-primary" onClick={openNew}><Plus size={16} /> Nuevo cliente</button>
      </div>

      <div className="card-pad !p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Buscar por nombre, documento o teléfono..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr><th className="th">Nombre</th><th className="th">Documento</th><th className="th">Teléfono</th><th className="th">Email</th><th className="th">Compras</th><th className="th">Acciones</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td className="td text-center text-slate-400" colSpan={6}>Sin clientes</td></tr>}
              {filtered.map((c) => {
                const buys = sales.filter((s) => s.customerId === c.id).length;
                return (
                  <tr key={c.id}>
                    <td className="td font-medium">{c.name}</td>
                    <td className="td text-slate-500">{c.document}</td>
                    <td className="td">{c.phone}</td>
                    <td className="td text-slate-500">{c.email}</td>
                    <td className="td"><span className="badge bg-slate-100 text-slate-700">{buys}</span></td>
                    <td className="td">
                      <div className="flex gap-1">
                        <button className="p-1.5 rounded hover:bg-slate-100 text-slate-600" onClick={() => openEdit(c)}><Pencil size={15} /></button>
                        <button className="p-1.5 rounded hover:bg-red-50 text-red-600" onClick={() => remove(c.id)}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Editar cliente" : "Nuevo cliente"}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><label className="label">Nombre *</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Documento</label><input className="input" value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} /></div>
          <div><label className="label">Teléfono</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><label className="label">Email</label><input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label">Dirección</label><input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button className="btn-secondary" onClick={() => setOpen(false)}>Cancelar</button>
          <button className="btn-primary" onClick={save}>Guardar</button>
        </div>
      </Modal>
    </div>
  );
}