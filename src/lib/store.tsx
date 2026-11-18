import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { api } from "./api";
import type { Product, Customer, Sale, CashEntry } from "./types";

interface CashSession {
  id: string; openedAt: string; closedAt?: string; openingAmount: number; closingAmount?: number;
  expectedAmount?: number; difference?: number; status: "open"|"closed"; userId?: string;
}
interface CreditPayment { id: string; saleId: string; date: string; amount: number; note: string; userId?: string; }

interface StoreValue {
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  cash: CashEntry[];
  cashSessions: CashSession[];
  creditPayments: CreditPayment[];
  settings: Record<string, string>;
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

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cash, setCash] = useState<CashEntry[]>([]);
  const [cashSessions, setCashSessions] = useState<CashSession[]>([]);
  const [creditPayments, setCreditPayments] = useState<CreditPayment[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const reloadAll = useCallback(async () => {
    if (!localStorage.getItem("autostock_token")) return;
    setLoading(true);
    try {
      const [ps, cs, ss, csh, sess, pays, sets] = await Promise.all([
        api("/products"),
        api("/customers"),
        api("/sales"),
        api("/cash/entries"),
        api("/cash/sessions"),
        api("/credits/payments"),
        api("/settings"),
      ]);
      setProducts(ps as any);
      setCustomers(cs as any);
      setSales(ss as any);
      setCash(csh as any);
      setCashSessions(sess as any);
      setCreditPayments(pays as any);
      setSettings(sets as any);
    } catch (e) {
      console.error("reload error", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reloadAll(); }, [reloadAll]);

  // products
  const addProduct = useCallback(async (p: any) => {
    const r: any = await api("/products", { method: "POST", body: JSON.stringify(p) });
    await reloadAll();
    return { ...p, id: r.id } as any;
  }, [reloadAll]);
  const updateProduct = useCallback(async (p: any) => {
    await api(`/products/${p.id}`, { method: "PUT", body: JSON.stringify(p) });
    await reloadAll();
  }, [reloadAll]);
  const deleteProduct = useCallback(async (id: string) => {
    await api(`/products/${id}`, { method: "DELETE" });
    await reloadAll();
  }, [reloadAll]);
  const getProduct = useCallback((id: string) => products.find((p: any) => p.id === id), [products]);

  // customers
  const addCustomer = useCallback(async (c: any) => {
    const r: any = await api("/customers", { method: "POST", body: JSON.stringify(c) });
    await reloadAll();
    return { ...c, id: r.id } as any;
  }, [reloadAll]);
  const updateCustomer = useCallback(async (c: any) => {
    await api(`/customers/${c.id}`, { method: "PUT", body: JSON.stringify(c) });
    await reloadAll();
  }, [reloadAll]);
  const deleteCustomer = useCallback(async (id: string) => {
    await api(`/customers/${id}`, { method: "DELETE" });
    await reloadAll();
  }, [reloadAll]);
  const getCustomer = useCallback((id: string) => customers.find((c: any) => c.id === id), [customers]);

  // sales
  const addSale = useCallback(async (s: any) => {
    const r: any = await api("/sales", { method: "POST", body: JSON.stringify(s) });
    await reloadAll();
    return r;
  }, [reloadAll]);

  // cash
  const addCash = useCallback(async (e: any) => {
    const r: any = await api("/cash/entries", { method: "POST", body: JSON.stringify(e) });
    await reloadAll();
    return r;
  }, [reloadAll]);
  const deleteCash = useCallback(async (id: string) => {
    await api(`/cash/entries/${id}`, { method: "DELETE" });
    await reloadAll();
  }, [reloadAll]);
  const openCash = useCallback(async (amount: number) => {
    const r: any = await api("/cash/open", { method: "POST", body: JSON.stringify({ openingAmount: amount }) });
    await reloadAll();
    return r;
  }, [reloadAll]);
  const closeCash = useCallback(async (sessionId: string, closingAmount: number) => {
    const r: any = await api("/cash/close", { method: "POST", body: JSON.stringify({ sessionId, closingAmount }) });
    await reloadAll();
    return r;
  }, [reloadAll]);

  // credits
  const addCreditPayment = useCallback(async (p: any) => {
    const r: any = await api("/credits/payments", { method: "POST", body: JSON.stringify({ saleId: p.saleId, amount: p.amount, note: p.note }) });
    await reloadAll();
    return r;
  }, [reloadAll]);

  const updateSettings = useCallback(async (s: any) => {
    await api("/settings", { method: "PUT", body: JSON.stringify(s) });
    await reloadAll();
  }, [reloadAll]);

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