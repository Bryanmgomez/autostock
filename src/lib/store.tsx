import React, { createContext, useContext, useState, useCallback } from "react";
import { read, write, uid } from "./storage";
import { ensureSeed, PRODUCTS_KEY, CUSTOMERS_KEY, SALES_KEY, CASH_KEY, CREDIT_PAYMENTS_KEY } from "./seed";
import type { Product, Customer, Sale, CashEntry, CreditPayment } from "./types";

interface StoreValue {
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  cash: CashEntry[];
  creditPayments: CreditPayment[];
  // products
  addProduct: (p: Omit<Product, "id" | "createdAt">) => Product;
  updateProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  getProduct: (id: string) => Product | undefined;
  // customers
  addCustomer: (c: Omit<Customer, "id" | "createdAt">) => Customer;
  updateCustomer: (c: Customer) => void;
  deleteCustomer: (id: string) => void;
  getCustomer: (id: string) => Customer | undefined;
  // sales
  addSale: (s: Omit<Sale, "id" | "date">) => Sale;
  // cash
  addCash: (e: Omit<CashEntry, "id" | "date">) => CashEntry;
  deleteCash: (id: string) => void;
  // credit payments
  addCreditPayment: (p: Omit<CreditPayment, "id" | "date">) => CreditPayment;
  reload: () => void;
}

const Ctx = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  ensureSeed();
  const [products, setProducts] = useState<Product[]>(() => read<Product[]>(PRODUCTS_KEY, []));
  const [customers, setCustomers] = useState<Customer[]>(() => read<Customer[]>(CUSTOMERS_KEY, []));
  const [sales, setSales] = useState<Sale[]>(() => read<Sale[]>(SALES_KEY, []));
  const [cash, setCash] = useState<CashEntry[]>(() => read<CashEntry[]>(CASH_KEY, []));
  const [creditPayments, setCreditPayments] = useState<CreditPayment[]>(() => read<CreditPayment[]>(CREDIT_PAYMENTS_KEY, []));

  const persist = useCallback((key: string, val: any) => write(key, val), []);

  const addProduct = useCallback((p: Omit<Product, "id" | "createdAt">) => {
    const np: Product = { ...p, id: uid(), createdAt: new Date().toISOString() };
    setProducts((prev) => { const n = [np, ...prev]; persist(PRODUCTS_KEY, n); return n; });
    return np;
  }, [persist]);

  const updateProduct = useCallback((p: Product) => {
    setProducts((prev) => { const n = prev.map((x) => (x.id === p.id ? p : x)); persist(PRODUCTS_KEY, n); return n; });
  }, [persist]);

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => { const n = prev.filter((x) => x.id !== id); persist(PRODUCTS_KEY, n); return n; });
  }, [persist]);

  const getProduct = useCallback((id: string) => products.find((p) => p.id === id), [products]);

  const addCustomer = useCallback((c: Omit<Customer, "id" | "createdAt">) => {
    const nc: Customer = { ...c, id: uid(), createdAt: new Date().toISOString() };
    setCustomers((prev) => { const n = [nc, ...prev]; persist(CUSTOMERS_KEY, n); return n; });
    return nc;
  }, [persist]);

  const updateCustomer = useCallback((c: Customer) => {
    setCustomers((prev) => { const n = prev.map((x) => (x.id === c.id ? c : x)); persist(CUSTOMERS_KEY, n); return n; });
  }, [persist]);

  const deleteCustomer = useCallback((id: string) => {
    setCustomers((prev) => { const n = prev.filter((x) => x.id !== id); persist(CUSTOMERS_KEY, n); return n; });
  }, [persist]);

  const getCustomer = useCallback((id: string) => customers.find((c) => c.id === id), [customers]);

  const addSale = useCallback((s: Omit<Sale, "id" | "date">) => {
    const ns: Sale = { ...s, id: uid(), date: new Date().toISOString() };
    setSales((prev) => { const n = [ns, ...prev]; persist(SALES_KEY, n); return n; });
    // adjust stock
    ns.items.forEach((it) => {
      setProducts((prev) => {
        const n = prev.map((p) => p.id === it.productId ? { ...p, stock: Math.max(0, p.stock - it.qty) } : p);
        persist(PRODUCTS_KEY, n);
        return n;
      });
    });
    // cash entry if not credit and paid
    if (!ns.credit && ns.paid > 0) {
      const ce: CashEntry = { id: uid(), date: ns.date, type: "in", amount: ns.paid, description: `Venta #${ns.id.slice(-6)}`, category: "Venta", refId: ns.id };
      setCash((prev) => { const n = [ce, ...prev]; persist(CASH_KEY, n); return n; });
    }
    if (ns.credit) {
      // record full total as receivable; no cash yet
    }
    return ns;
  }, [persist]);

  const addCash = useCallback((e: Omit<CashEntry, "id" | "date">) => {
    const ne: CashEntry = { ...e, id: uid(), date: new Date().toISOString() };
    setCash((prev) => { const n = [ne, ...prev]; persist(CASH_KEY, n); return n; });
    return ne;
  }, [persist]);

  const deleteCash = useCallback((id: string) => {
    setCash((prev) => { const n = prev.filter((x) => x.id !== id); persist(CASH_KEY, n); return n; });
  }, [persist]);

  const addCreditPayment = useCallback((p: Omit<CreditPayment, "id" | "date">) => {
    const np: CreditPayment = { ...p, id: uid(), date: new Date().toISOString() };
    setCreditPayments((prev) => { const n = [np, ...prev]; persist(CREDIT_PAYMENTS_KEY, n); return n; });
    // cash entry
    const ce: CashEntry = { id: uid(), date: np.date, type: "in", amount: np.amount, description: `Abono crédito`, category: "Crédito", refId: p.saleId };
    setCash((prev) => { const n = [ce, ...prev]; persist(CASH_KEY, n); return n; });
    return np;
  }, [persist]);

  const reload = useCallback(() => {
    setProducts(read<Product[]>(PRODUCTS_KEY, []));
    setCustomers(read<Customer[]>(CUSTOMERS_KEY, []));
    setSales(read<Sale[]>(SALES_KEY, []));
    setCash(read<CashEntry[]>(CASH_KEY, []));
    setCreditPayments(read<CreditPayment[]>(CREDIT_PAYMENTS_KEY, []));
  }, []);

  const value: StoreValue = {
    products, customers, sales, cash, creditPayments,
    addProduct, updateProduct, deleteProduct, getProduct,
    addCustomer, updateCustomer, deleteCustomer, getCustomer,
    addSale, addCash, deleteCash, addCreditPayment, reload,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore outside provider");
  return v;
}