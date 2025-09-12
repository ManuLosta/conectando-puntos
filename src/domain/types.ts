export type StockItem = {
  sku: string;
  name: string;
  qty: number;
  price: number; // currency unit
  expiryDays?: number; // days to expire
};

export type OrderItem = {
  sku: string;
  name: string;
  qty: number;
  price: number;
  lineTotal: number;
};

export type Order = {
  orderId: string;
  customer: string; // customer name
  status: "DRAFT" | "CONFIRMED" | "CANCELLED";
  items: OrderItem[];
  total: number;
  createdAt: string;
  confirmedAt?: string;
};

export type Customer = {
  id: string;
  name: string;
};

export function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
