import { Customer, Order, StockItem } from "@/domain/types";

export const store = {
  stock: [
    {
      sku: "AR-001",
      name: "Queso La Serenísima 1kg",
      qty: 80,
      price: 1500,
      expiryDays: 25,
    },
    { sku: "AR-002", name: "Yerba 1kg", qty: 42, price: 1000, expiryDays: 180 },
    {
      sku: "AR-003",
      name: "Aceite 900ml",
      qty: 15,
      price: 2000,
      expiryDays: 40,
    },
    {
      sku: "AR-004",
      name: "Galletitas 500g",
      qty: 60,
      price: 800,
      expiryDays: 12,
    },
  ] as StockItem[],
  customers: [
    { id: "C-001", name: "Supermercado Don Pepe" },
    { id: "C-002", name: "Almacén La Esquina" },
    { id: "C-003", name: "MaxiKiosco Centro" },
  ] as Customer[],
  orders: [] as Order[],
};

export function makeOrderId(): string {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${Date.now().toString().slice(-6)}-${rand}`;
}
