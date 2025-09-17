// Customer Domain DTOs - Clean interfaces for AI tools

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  distributorId: string; // Tenant isolation
}

export interface CustomerSearchResult {
  id: string;
  name: string;
  phone?: string;
  city?: string;
}
