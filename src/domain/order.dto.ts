// Order Domain DTOs - Clean interfaces for AI tools

export interface OrderCreateRequest {
  distributorId: string;
  salespersonId: string;
  clientId: string;
  items: OrderItemRequest[];
  deliveryAddress?: string;
  notes?: string;
}

export interface OrderItemRequest {
  sku: string;
  quantity: number;
}

export interface OrderResponse {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  distributorId: string;
  clientId: string | null;
  salespersonId: string | null;
  deliveryAddress: string | null;
  notes: string | null;
  createdAt: Date;
  items: OrderItemResponse[];
}

export interface OrderItemResponse {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  subtotal: number;
  product: {
    name: string;
    sku: string;
  };
}
