// Suggestion Domain DTOs - Clean interfaces for AI tools

export interface SuggestedProduct {
  product_id: string;
  sku: string;
  name: string;
  price: number;

  // AI Features
  f_client_orders_cnt_26w: number;
  f_client_qty_26w: number;
  f_last_buy_at?: Date;
  f_client_bought_before: boolean;

  f_global_orders_cnt_1y: number;
  f_global_buyers_cnt_1y: number;
  f_global_qty_1y: number;

  f_is_new: boolean;

  f_stock_total: number;
  f_min_days_to_expiry?: number;
  f_has_stock: boolean;
  f_expiring_soon: boolean;
}

export interface ProductSuggestionRequest {
  distributorId: string;
  clientId: string;
  asOf?: Date;
  top?: number;
}
