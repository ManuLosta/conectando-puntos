// Catalog Domain DTOs - Clean interfaces for AI tools

export interface CatalogItem {
  id: string;
  name: string;
  description?: string;
  sku: string;
  price: number;
  distributorId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductSearchResult {
  id: string;
  sku: string;
  name: string;
  price: number;
  isActive: boolean;
}
