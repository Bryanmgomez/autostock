import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard, Package, ShoppingCart, Users, Receipt, Wallet, CreditCard, BarChart3, Menu, Store,
} from "lucide-react";

const nav = [
  { to: "/", label: "Panel principal", icon: LayoutDashboard, end: true },
  { to: "/inventory", label: "Inventario", icon: Package },
  { to: "/sales", label: "Ventas", icon: ShoppingCart },
  { to: "/customers", label: "Clientes", icon: Users },
  { to: "/invoices", label: "Facturación", icon: Receipt },
  { to: "/cash", label: "Caja", icon: Wallet },
  { to: "/credits", label: "Créditos", icon: CreditCard },
  { to: "/reports", label: "Reportes", icon: BarChart3 },
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-100 transform transition-transform md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"} md:static md:transform-none`}>
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800">
          <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center">
            <Store size={20} />
          </div>
          <div>
            <div className="font-bold text-lg leading-none">AutoStock</div>
            <div className="text-xs text-slate-400">Papelería & Variedades</div>
          </div>
        </div>
        <nav className="p-3 space-y-1">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-brand-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <n.icon size={18} />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 text-xs text-slate-500 border-t border-slate-800">
          © 2026 Tecnológico de Antioquia
        </div>
      </aside>

      {open && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 no-print">
          <button className="md:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="font-semibold text-slate-700 hidden md:block">Sistema de gestión AutoStock</div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="hidden sm:inline">Almacenamiento local</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}