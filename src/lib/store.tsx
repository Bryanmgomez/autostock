import React, { createContext, useContext, useState, useCallback } from "react";
import { read, write, uid } from "./storage";
import type { Product, Customer, Sale, CashEntry } from "./types";

const K = {
  PRODUCTS: "products",
  CUSTOMERS: "customers",
  SALES: "sales",
  CASH: "cash",
  SESSIONS: "cashSessions",
  CREDITS: "creditPayments",
  SETTINGS: "settings",
  SEEDED: "seeded",
};

interface CashSession { id: string; openedAt: string; closedAt?: string; openingAmount: number; closingAmount?: number; expectedAmount?: number; difference?: number; status: "open"|"closed"; userId?: string; }
interface CreditPayment { id: string; saleId: string; date: string; amount: number; note: string; userId?: string; }

interface StoreValue {
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  cash: CashEntry[];
  cashSessions: CashSession[];
  creditPayments: CreditPayment[];
  settings: Record<string,string>;
  loading: boolean;
  reloadAll: () => Promise<void>;
  addProduct: (p: any) => Promise<Product>;
  updateProduct: (p: any) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProduct: (id: string) => Product | undefined;
  addCustomer: (c: any) => Promise<Customer>;
  updateCustomer: (c: any) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  getCustomer: (id: string) => Customer | undefined;
  addSale: (s: any) => Promise<any>;
  addCash: (e: any) => Promise<CashEntry>;
  deleteCash: (id: string) => Promise<void>;
  openCash: (amount: number) => Promise<any>;
  closeCash: (sessionId: string, closingAmount: number) => Promise<any>;
  addCreditPayment: (p: { saleId: string; amount: number; note?: string }) => Promise<any>;
  updateSettings: (s: any) => Promise<void>;
}

const Ctx = createContext<StoreValue | null>(null);

function seed() {
  if (read<boolean>(K.SEEDED, false)) return;
  const now = new Date().toISOString();
  const products: Product[] = [
    { id: uid(), name: "Cuaderno 100 hojas", sku: "CUA-100", category: "Papelería", price: 8500, cost: 5200, stock: 45, minStock: 10, description: "Cuaderno cuadriculado 100 hojas", createdAt: now },
    { id: uid(), name: "Lápiz HB", sku: "LAP-HB", category: "Escolar", price: 1200, cost: 600, stock: 120, minStock: 20, description: "Lápiz grafito HB", createdAt: now },
    { id: uid(), name: "Bolígrafo azul", sku: "BOL-AZ", category: "Papelería", price: 2500, cost: 1200, stock: 80, minStock: 15, description: "Bolígrafo tinta azul", createdAt: now },
    { id: uid(), name: "Resma papel carta", sku: "RES-CAR", category: "Oficina", price: 18000, cost: 13500, stock: 25, minStock: 5, description: "Resma 500 hojas carta", createdAt: now },
    { id: uid(), name: "Marcador permanente", sku: "MAR-PER", category: "Arte", price: 4500, cost: 2500, stock: 8, minStock: 10, description: "Marcador permanente negro", createdAt: now },
    { id: uid(), name: "Tijeras escolares", sku: "TIJ-ESC", category: "Escolar", price: 6000, cost: 3500, stock: 30, minStock: 8, description: "Tijeras punta roma", createdAt: now },
    { id: uid(), name: "Pegante en barra", sku: "PEG-BAR", category: "Escolar", price: 3500, cost: 1800, stock: 50, minStock: 10, description: "Pegante en barra 21g", createdAt: now },
    { id: uid(), name: "Carpeta plástica", sku: "CAR-PLA", category: "Oficina", price: 5000, cost: 2800, stock: 3, minStock: 8, description: "Carpeta plástica oficio", createdAt: now },
    { id: uid(), name: "Resaltador amarillo", sku: "RES-AMA", category: "Papelería", price: 3000, cost: 1500, stock: 60, minStock: 12, description: "Resaltador fluorescente", createdAt: now },
    { id: uid(), name: "Corrector líquido", sku: "COR-LIQ", category: "Papelería", price: 4000, cost: 2000, stock: 22, minStock: 8, description: "Corrector líquido 18ml", createdAt: now },
  ];
  const customers: Customer[] = [
    { id: uid(), name: "María", lastName: "García", docType: "CC", document: "1020304050", phone: "3001234567", email: "maria@example.com", address: "Calle 10 #5-20", createdAt: now },
    { id: uid(), name: "Juan", lastName: "Pérez", docType: "CC", document: "9876543210", phone: "3109876543", email: "juan@example.com", address: "Carrera 20 #15-30", createdAt: now },
    { id: uid(), name: "Empresa", lastName: "ABC S.A.S", docType: "NIT", document: "900123456", phone: "6041234567", email: "compras@abc.com", address: "Av. Principal #100", createdAt: now },
  ];
  write(K.PRODUCTS, products);
  write(K.CUSTOMERS, customers);
  write(K.SALES, []);
  write(K.CASH, [{ id: uid(), date: now, type: "in", amount: 200000, description: "Apertura de caja", category: "Apertura" }]);
  write(K.SESSIONS, []);
  write(K.CREDITS, []);
  write(K.SETTINGS, { iva_default: "19", allow_credit: "1" });
  write(K.SEEDED, true);
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  seed();
  const [products, setProducts] = useState<Product[]>(() => read<Product[]>(K.PRODUCTS, []));
  const [customers, setCustomers] = useState<Customer[]>(() => read<Customer[]>(K.CUSTOMERS, []));
  const [sales, setSales] = useState<Sale[]>(() => read<Sale[]>(K.SALES, []));
  const [cash, setCash] = useState<CashEntry[]>(() => read<CashEntry[]>(K.CASH, []));
  const [cashSessions, setCashSessions] = useState<any[]>(() => read<any[]>(K.SESSIONS, []));
  const [creditPayments, setCreditPayments] = useState<any[]>(() => read<any[]>(K.CREDITS, []));
  const [settings, setSettings] = useState<Record<string,string>>(() => read<Record<string,string>>(K.SETTINGS, {}));
  const loading = false;

  const reloadAll = useCallback(async () => {
    setProducts(read<Product[]>(K.PRODUCTS, []));
    setCustomers(read<Customer[]>(K.CUSTOMERS, []));
    setSales(read<Sale[]>(K.SALES, []));
    setCash(read<CashEntry[]>(K.CASH, []));
    setCashSessions(read<any[]>(K.SESSIONS, []));
    setCreditPayments(read<any[]>(K.CREDITS, []));
    setSettings(read<Record<string,string>>(K.SETTINGS, {}));
  }, []);

  // products
  const addProduct = useCallback(async (p: any) => {
    const np = { ...p, id: uid(), createdAt: new Date().toISOString() };
    const list = [np, ...read<Product[]>(K.PRODUCTS, [])];
    write(K.PRODUCTS, list); setProducts(list);
    return np;
  }, []);
  const updateProduct = useCallback(async (p: any) => {
    const list = read<Product[]>(K.PRODUCTS, []).map((x: any) => x.id === p.id ? { ...x, ...p } : x);
    write(K.PRODUCTS, list); setProducts(list);
  }, []);
  const deleteProduct = useCallback(async (id: string) => {
    const list = read<Product[]>(K.PRODUCTS, []).filter((x: any) => x.id !== id);
    write(K.PRODUCTS, list); setProducts(list);
  }, []);
  const getProduct = useCallback((id: string) => products.find((p: any) => p.id === id), [products]);

  // customers
  const addCustomer = useCallback(async (c: any) => {
    const nc = { ...c, id: uid(), createdAt: new Date().toISOString() };
    const list = [nc, ...read<Customer[]>(K.CUSTOMERS, [])];
    write(K.CUSTOMERS, list); setCustomers(list);
    return nc;
  }, []);
  const updateCustomer = useCallback(async (c: any) => {
    const list = read<Customer[]>(K.CUSTOMERS, []).map((x: any) => x.id === c.id ? { ...x, ...c } : x);
    write(K.CUSTOMERS, list); setCustomers(list);
  }, []);
  const deleteCustomer = useCallback(async (id: string) => {
    const list = read<Customer[]>(K.CUSTOMERS, []).filter((x: any) => x.id !== id);
    write(K.CUSTOMERS, list); setCustomers(list);
  }, []);
  const getCustomer = useCallback((id: string) => customers.find((c: any) => c.id === id), [customers]);

  // sales (with iva/discounts/stock/cash)
  const addSale = useCallback(async (s: any) => {
    const ns = { ...s, id: uid(), date: new Date().toISOString() };
    // stock decrement
    const products = read<Product[]>(K.PRODUCTS, []);
    for (const it of s.items) {
      const idx = products.findIndex((p: any) => p.id === it.productId);
      if (idx >= 0) products[idx] = { ...products[idx], stock: Math.max(0, products[idx].stock - it.qty) };
    }
    write(K.PRODUCTS, products); setProducts(products);
    const list = [ns, ...read<Sale[]>(K.SALES, [])];
    write(K.SALES, list); setSales(list);
    if (s.paymentMethod === "efectivo" && s.paid > 0) {
      const ce = { id: uid(), date: ns.date, type: "in", amount: s.paid, description: `Venta #${ns.id.slice(-6)}`, category: "Venta", refId: ns.id };
      const cashList = [ce, ...read<CashEntry[]>(K.CASH, [])];
      write(K.CASH, cashList); setCash(cashList as CashEntry[]);
    }
    if (s.credit && s.paid > 0) {
      const ce = { id: uid(), date: ns.date, type: "in", amount: s.paid, description: `Abono inicial crédito #${ns.id.slice(-6)}`, category: "Crédito", refId: ns.id };
      const cashList = [ce, ...read<CashEntry[]>(K.CASH, [])];
      write(K.CASH, cashList); setCash(cashList as CashEntry[]);
    }
    return ns;
  }, []);

  // cash
  const addCash = useCallback(async (e: any) => {
    const ne = { ...e, id: uid(), date: new Date().toISOString() };
    const list = [ne, ...read<CashEntry[]>(K.CASH, [])];
    write(K.CASH, list); setCash(list as CashEntry[]);
    return ne;
  }, []);
  const deleteCash = useCallback(async (id: string) => {
    const list = read<CashEntry[]>(K.CASH, []).filter((x: any) => x.id !== id);
    write(K.CASH, list); setCash(list as CashEntry[]);
  }, []);
  const openCash = useCallback(async (amount: number) => {
    const existing = read<any[]>(K.SESSIONS, []).find((s: any) => s.status === "open");
    if (existing) throw new Error("Ya hay una caja abierta");
    const id = uid();
    const now = new Date().toISOString();
    const sess = { id, openedAt: now, openingAmount: amount, status: "open" };
    const list = [sess, ...read<any[]>(K.SESSIONS, [])];
    write(K.SESSIONS, list); setCashSessions(list);
    // opening entry
    const ce = { id: uid(), date: now, type: "in", amount, description: "Apertura de caja", category: "Apertura" };
    const cashList = [ce, ...read<CashEntry[]>(K.CASH, [])];
    write(K.CASH, cashList); setCash(cashList as CashEntry[]);
    return sess;
  }, []);
  const closeCash = useCallback(async (sessionId: string, closingAmount: number) => {
    const sessions = read<any[]>(K.SESSIONS, []);
    const idx = sessions.findIndex((s: any) => s.id === sessionId && s.status === "open");
    if (idx < 0) throw new Error("Sesión no encontrada");
    const session = sessions[idx];
    const entries = read<CashEntry[]>(K.CASH, []).filter((e: any) => new Date(e.date) >= new Date(session.openedAt));
    let ins = 0, outs = 0;
    for (const e of entries) { if (e.type === "in") ins += e.amount; else outs += e.amount; }
    const expected = ins - outs;
    const diff = closingAmount - expected;
    const now = new Date().toISOString();
    sessions[idx] = { ...session, closedAt: now, closingAmount, expectedAmount: expected, difference: diff, status: "closed" };
    write(K.SESSIONS, sessions); setCashSessions(sessions);
    return { expected, closing: closingAmount, difference: diff };
  }, []);

  // credits
  const addCreditPayment = useCallback(async (p: any) => {
    const np = { id: uid(), saleId: p.saleId, date: new Date().toISOString(), amount: p.amount, note: p.note || "" };
    const list = [np, ...read<any[]>(K.CREDITS, [])];
    write(K.CREDITS, list); setCreditPayments(list);
    const ce = { id: uid(), date: np.date, type: "in", amount: p.amount, description: `Abono crédito #${p.saleId.slice(-6)}`, category: "Crédito", refId: p.saleId };
    const cashList = [ce, ...read<CashEntry[]>(K.CASH, [])];
    write(K.CASH, cashList); setCash(cashList as CashEntry[]);
    return np;
  }, []);

  const updateSettings = useCallback(async (s: any) => {
    const cur = read<Record<string,string>>(K.SETTINGS, {});
    write(K.SETTINGS, { ...cur, ...s });
    setSettings({ ...cur, ...s });
  }, []);

  const value: StoreValue = {
    products, customers, sales, cash, cashSessions, creditPayments, settings, loading,
    reloadAll, addProduct, updateProduct, deleteProduct, getProduct,
    addCustomer, updateCustomer, deleteCustomer, getCustomer,
    addSale, addCash, deleteCash, openCash, closeCash, addCreditPayment, updateSettings,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore outside provider");
  return v;
}