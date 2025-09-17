// Catalog Domain DTOs - Clean interfaces for AI tools

export interface CatalogItem {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  price: number;
  stock: number;
  isActive: boolean;
}

export interface ProductSearchResult {
  id: string;
  sku: string;
  name: string;
  price: number;
  isActive: boolean;
}
