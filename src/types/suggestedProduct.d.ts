export type SuggestedProduct = {
  product_id: string;
  sku: string;
  name: string;
  price: number;

  // Historial del cliente
  f_client_orders_cnt_26w: number;
  f_client_qty_26w: number;
  f_last_buy_at: Date | null;
  f_client_bought_before: boolean;

  // Popularidad global
  f_global_orders_cnt_1y: number;
  f_global_buyers_cnt_1y: number;
  f_global_qty_1y: number;

  // Novedad
  f_is_new: boolean;

  // Stock / vencimiento
  f_stock_total: number;
  f_min_days_to_expiry: number | null;
  f_has_stock: boolean;
  f_expiring_soon: boolean;
};
