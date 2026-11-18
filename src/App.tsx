import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./lib/auth";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales";
import Customers from "./pages/Customers";
import Invoices from "./pages/Invoices";
import Cash from "./pages/Cash";
import Credits from "./pages/Credits";
import Reports from "./pages/Reports";

function Guard({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/sales" replace />;
  return <>{children}</>;
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Cargando...</div>;
  if (!user) {
    return (
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </HashRouter>
    );
  }
  return (
    <HashRouter>
      <Routes>
      <Route element={<Layout />}>
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/" element={<Guard roles={["gerente"]}><Dashboard /></Guard>} />
        <Route path="inventory" element={<Guard roles={["gerente"]}><Inventory /></Guard>} />
        <Route path="sales" element={<Sales />} />
        <Route path="customers" element={<Customers />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="cash" element={<Cash />} />
        <Route path="credits" element={<Credits />} />
        <Route path="reports" element={<Guard roles={["gerente"]}><Reports /></Guard>} />
        <Route path="*" element={<Navigate to="/sales" replace />} />
      </Route>
    </Routes>
    </HashRouter>
  );
}