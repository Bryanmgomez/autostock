import { useMemo } from "react";
import { useStore } from "../lib/store";
import { money } from "../lib/storage";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";

export default function Reports() {
  const { sales, products } = useStore();

  const totalRevenue = sales.reduce((a, s) => a + s.total, 0);
  const totalSales = sales.length;
  const avgTicket = totalSales ? totalRevenue / totalSales : 0;

  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number }> = {};
    sales.forEach((s) => s.items.forEach((it) => {
      if (!map[it.productId]) map[it.productId] = { name: it.name, qty: 0, revenue: 0 };
      map[it.productId].qty += it.qty;
      map[it.productId].revenue += it.price * it.qty - it.discount;
    }));
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [sales]);

  const byPayment = useMemo(() => {
    const map: Record<string, number> = {};
    sales.forEach((s) => { map[s.paymentMethod] = (map[s.paymentMethod] || 0) + s.total; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [sales]);

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    sales.forEach((s) => s.items.forEach((it) => {
      const p = products.find((x) => x.id === it.productId);
      const cat = p?.category || "Otros";
      map[cat] = (map[cat] || 0) + it.qty;
    }));
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [sales, products]);

  const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Reportes</h1>
        <p className="text-slate-500 text-sm">Estadísticas del negocio</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-pad"><div className="text-xs font-semibold text-slate-500 uppercase">Ingresos totales</div><div className="text-2xl font-bold mt-1 text-brand-600">{money(totalRevenue)}</div></div>
        <div className="card-pad"><div className="text-xs font-semibold text-slate-500 uppercase">Total ventas</div><div className="text-2xl font-bold mt-1">{totalSales}</div></div>
        <div className="card-pad"><div className="text-xs font-semibold text-slate-500 uppercase">Ticket promedio</div><div className="text-2xl font-bold mt-1">{money(avgTicket)}</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card-pad">
          <h3 className="font-semibold text-slate-800 mb-4">Productos más vendidos (por ingresos)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
                <Tooltip formatter={(v: any) => money(Number(v))} />
                <Bar dataKey="revenue" fill="#4f46e5" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-pad">
          <h3 className="font-semibold text-slate-800 mb-4">Ventas por método de pago</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byPayment} dataKey="value" nameKey="name" outerRadius={90} label={(e: any) => e.name}>
                  {byPayment.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => money(Number(v))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card-pad">
        <h3 className="font-semibold text-slate-800 mb-4">Cantidad vendida por categoría</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card-pad">
        <h3 className="font-semibold text-slate-800 mb-4">Detalle de productos vendidos</h3>
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr><th className="th">Producto</th><th className="th">Cantidad</th><th className="th">Ingresos</th></tr></thead>
            <tbody>
              {topProducts.length === 0 && <tr><td className="td text-center text-slate-400" colSpan={3}>Sin datos</td></tr>}
              {topProducts.map((p, i) => (
                <tr key={i}>
                  <td className="td font-medium">{p.name}</td>
                  <td className="td">{p.qty}</td>
                  <td className="td font-semibold">{money(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}