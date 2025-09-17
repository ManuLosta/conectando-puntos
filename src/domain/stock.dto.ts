// Stock Domain DTOs - Clean interfaces for AI tools

export interface StockItem {
  sku: string;
  name: string;
  price: number;
  stock: number;
  expiryDays?: number; // days to expire
  distributorId: string;
}

export interface StockSearchResult {
  id: string;
  sku: string;
  name: string;
  price: number;
  availableStock: number;
  expiryDays?: number;
}
