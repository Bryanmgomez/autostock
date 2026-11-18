import { useState } from "react";
import { useStore } from "../lib/store";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import Modal from "../components/Modal";

const empty = { name: "", lastName: "", docType: "CC", document: "", phone: "", email: "", address: "" };

const DOC_TYPES = ["CC", "CE", "NIT", "TI", "Pasaporte"];

export default function Customers() {
  const { customers, addCustomer, updateCustomer, deleteCustomer, sales } = useStore();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<any>(empty);

  // client-side filter (backend also filters, but data already loaded)
  const filtered = customers.filter((c: any) => {
    const hay = `${c.name} ${c.lastName || ""} ${c.document}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  function openNew() { setEditing(null); setForm(empty); setOpen(true); }
  function openEdit(c: any) { setEditing(c.id); setForm({ name: c.name, lastName: c.lastName || "", docType: c.docType || "CC", document: c.document, phone: c.phone || "", email: c.email || "", address: c.address || "" }); setOpen(true); }
  async function save() {
    if (!form.name.trim()) { alert("El nombre es obligatorio"); return; }
    if (!form.document.trim()) { alert("El documento es obligatorio"); return; }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { alert("Email inválido"); return; }
    try {
      if (editing) await updateCustomer({ ...form, id: editing, lastName: form.lastName, docType: form.docType });
      else await addCustomer({ name: form.name, lastName: form.lastName, docType: form.docType, document: form.document, phone: form.phone, email: form.email, address: form.address });
      setOpen(false);
    } catch (e: any) { alert(e.message); }
  }
  async function remove(id: string) {
    const hasSales = sales.some((s: any) => s.customerId === id);
    if (hasSales) { alert("No se puede eliminar: el cliente tiene ventas registradas."); return; }
    if (confirm("¿Eliminar este cliente?")) {
      try { await deleteCustomer(id); } catch (e: any) { alert(e.message); }
    }
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
          <input className="input pl-9" placeholder="Buscar por nombre, apellido o documento..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr><th className="th">Nombre</th><th className="th">Apellido</th><th className="th">Tipo doc.</th><th className="th">Documento</th><th className="th">Teléfono</th><th className="th">Email</th><th className="th">Compras</th><th className="th">Acciones</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td className="td text-center text-slate-400" colSpan={8}>Sin clientes</td></tr>}
              {filtered.map((c: any) => {
                const buys = sales.filter((s: any) => s.customerId === c.id).length;
                return (
                  <tr key={c.id}>
                    <td className="td font-medium">{c.name}</td>
                    <td className="td">{c.lastName}</td>
                    <td className="td text-slate-500">{c.docType}</td>
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
          <div><label className="label">Nombre *</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "") })} /></div>
          <div><label className="label">Apellido</label><input className="input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "") })} /></div>
          <div><label className="label">Tipo de documento</label>
            <select className="input" value={form.docType} onChange={(e) => setForm({ ...form, docType: e.target.value })}>
              {DOC_TYPES.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div><label className="label">Número de documento *</label><input className="input" value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value.replace(/\D/g, "") })} /></div>
          <div><label className="label">Teléfono</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })} /></div>
          <div><label className="label">Email</label><input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value.replace(/[^a-zA-Z0-9@._+\-]/g, "") })} /></div>
          <div className="sm:col-span-2"><label className="label">Dirección</label><input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button className="btn-secondary" onClick={() => setOpen(false)}>Cancelar</button>
          <button className="btn-primary" onClick={save}>Guardar</button>
        </div>
      </Modal>
    </div>
  );
}