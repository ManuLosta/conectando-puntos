// Customer Domain DTOs - Clean interfaces for AI tools

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  distributorId: string; // Tenant isolation
  clientType?: string;
  notes?: string;
  assignedSalespersonId?: string;
}

export interface CustomerSearchResult {
  id: string;
  name: string;
  phone?: string;
  city?: string;
}
