import { useMemo } from "react";
import { useStore } from "../lib/store";
import { money, formatDate } from "../lib/storage";
import { Package, Users, ShoppingCart, DollarSign, AlertTriangle, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function Dashboard() {
  const { products, customers, sales } = useStore();

  const today = new Date().toDateString();
  const todaySales = sales.filter((s) => new Date(s.date).toDateString() === today);
  const todayRevenue = todaySales.reduce((a, s) => a + s.total, 0);
  const totalRevenue = sales.reduce((a, s) => a + s.total, 0);
  const lowStock = products.filter((p) => p.stock <= p.minStock);

  const last7 = useMemo(() => {
    const days: { day: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toDateString();
      const tot = sales.filter((s) => new Date(s.date).toDateString() === key).reduce((a, s) => a + s.total, 0);
      days.push({ day: d.toLocaleDateString("es-CO", { weekday: "short" }), total: tot });
    }
    return days;
  }, [sales]);

  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; qty: number }> = {};
    sales.forEach((s) => s.items.forEach((it) => {
      if (!map[it.productId]) map[it.productId] = { name: it.name, qty: 0 };
      map[it.productId].qty += it.qty;
    }));
    return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [sales]);

  const cards = [
    { label: "Ventas hoy", value: todaySales.length, icon: ShoppingCart, color: "bg-blue-50 text-blue-600" },
    { label: "Ingresos hoy", value: money(todayRevenue), icon: DollarSign, color: "bg-emerald-50 text-emerald-600" },
    { label: "Productos", value: products.length, icon: Package, color: "bg-indigo-50 text-indigo-600" },
    { label: "Clientes", value: customers.length, icon: Users, color: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Panel principal</h1>
        <p className="text-slate-500 text-sm">Resumen general del negocio</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="card-pad">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{c.label}</div>
                <div className="text-2xl font-bold text-slate-800 mt-1">{c.value}</div>
              </div>
              <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${c.color}`}>
                <c.icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card-pad lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Ventas últimos 7 días</h3>
            <TrendingUp size={18} className="text-slate-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: any) => money(Number(v))} />
                <Bar dataKey="total" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-pad">
          <h3 className="font-semibold text-slate-800 mb-4">Productos más vendidos</h3>
          {topProducts.length === 0 ? (
            <p className="text-sm text-slate-400">Sin ventas aún</p>
          ) : (
            <ul className="space-y-3">
              {topProducts.map((p, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span className="text-sm text-slate-700 truncate">{p.name}</span>
                  <span className="text-sm font-semibold text-brand-600">{p.qty} uds</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 pt-4 border-t border-slate-100 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Ingresos totales</span><span className="font-semibold">{money(totalRevenue)}</span></div>
          </div>
        </div>
      </div>

      {/* Low stock alerts */}
      <div className="card-pad">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={18} className="text-amber-500" />
          <h3 className="font-semibold text-slate-800">Alertas de inventario bajo</h3>
        </div>
        {lowStock.length === 0 ? (
          <p className="text-sm text-emerald-600">Todo el inventario está en niveles adecuados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th className="th">Producto</th><th className="th">SKU</th><th className="th">Stock</th><th className="th">Mínimo</th></tr></thead>
              <tbody>
                {lowStock.map((p) => (
                  <tr key={p.id}>
                    <td className="td font-medium">{p.name}</td>
                    <td className="td text-slate-500">{p.sku}</td>
                    <td className="td"><span className="badge bg-red-100 text-red-700">{p.stock}</span></td>
                    <td className="td">{p.minStock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent sales */}
      <div className="card-pad">
        <h3 className="font-semibold text-slate-800 mb-4">Ventas recientes</h3>
        {sales.length === 0 ? <p className="text-sm text-slate-400">Sin ventas registradas</p> : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th className="th">Fecha</th><th className="th">Cliente</th><th className="th">Items</th><th className="th">Total</th><th className="th">Método</th></tr></thead>
              <tbody>
                {sales.slice(0, 8).map((s) => (
                  <tr key={s.id}>
                    <td className="td text-slate-500">{formatDate(s.date)}</td>
                    <td className="td">{s.customerName || "Cliente general"}</td>
                    <td className="td">{s.items.length}</td>
                    <td className="td font-semibold">{money(s.total)}</td>
                    <td className="td"><span className="badge bg-slate-100 text-slate-700">{s.paymentMethod}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}