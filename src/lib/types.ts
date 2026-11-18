export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  description: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  lastName?: string;
  docType?: string;
  document: string;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
  discount: number; // per line amount
}

export interface Sale {
  id: string;
  date: string;
  customerId: string | null;
  customerName: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: "efectivo" | "tarjeta" | "transferencia" | "credito";
  paid: number;
  credit: boolean;
  notes: string;
}

export interface CashEntry {
  id: string;
  date: string;
  type: "in" | "out";
  amount: number;
  description: string;
  category: string;
  refId?: string;
}

export interface CreditPayment {
  id: string;
  saleId: string;
  date: string;
  amount: number;
  note: string;
}

export const CATEGORIES = ["Papelería", "Variedades", "Escolar", "Oficina", "Arte", "Otros"];
export const PAYMENT_METHODS = [
  { value: "efectivo", label: "Efectivo" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "transferencia", label: "Transferencia" },
  { value: "credito", label: "Crédito" },
];