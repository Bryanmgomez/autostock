import { read, write, uid } from "./storage";
import type { Product, Customer, CashEntry } from "./types";

export const PRODUCTS_KEY = "products";
export const CUSTOMERS_KEY = "customers";
export const SALES_KEY = "sales";
export const CASH_KEY = "cash";
const SEEDED_KEY = "seeded";

export function ensureSeed() {
  if (read<boolean>(SEEDED_KEY, false)) return;
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
    { id: uid(), name: "María García", document: "1020304050", phone: "3001234567", email: "maria@example.com", address: "Calle 10 #5-20", createdAt: now },
    { id: uid(), name: "Juan Pérez", document: "9876543210", phone: "3109876543", email: "juan@example.com", address: "Carrera 20 #15-30", createdAt: now },
    { id: uid(), name: "Empresa ABC S.A.S", document: "900123456", phone: "6041234567", email: "compras@abc.com", address: "Av. Principal #100", createdAt: now },
  ];

  write(PRODUCTS_KEY, products);
  write(CUSTOMERS_KEY, customers);
  write(SALES_KEY, []);
  write(CASH_KEY, []);

  // initial cash opening
  const cash: CashEntry[] = [
    { id: uid(), date: now, type: "in", amount: 200000, description: "Apertura de caja", category: "Apertura", refId: undefined },
  ];
  write(CASH_KEY, cash);

  write(SEEDED_KEY, true);
}

export const CREDIT_PAYMENTS_KEY = "creditPayments";