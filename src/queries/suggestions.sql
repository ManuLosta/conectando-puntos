WITH
params AS (
  SELECT
    :client_id::text       AS client_id,
    :distributor_id::text  AS distributor_id,
    :as_of::timestamptz    AS as_of,
    182                    AS lookback_client_days,   -- 26 semanas
    365                    AS lookback_global_days,   -- 1 año
    90                     AS new_days,
    14                     AS avoid_repeat_days,
    30                     AS min_expiry_days,
    30                     AS top_global_limit,
    30                     AS top_new_limit
),
-- 1) Ventanas de tiempo
bounds AS (
  SELECT
    p.*,
    (p.as_of - (p.lookback_client_days || ' days')::interval) AS since_client,
    (p.as_of - (p.lookback_global_days || ' days')::interval) AS since_global,
    (p.as_of - (p.new_days || ' days')::interval)             AS since_new,
    (p.as_of - (p.avoid_repeat_days || ' days')::interval)    AS since_avoid
  FROM params p
),
-- 2) Historial del cliente en 26 semanas (para features y candidatos)
client_items AS (
  SELECT
    oi."productId"                           AS product_id,
    COUNT(DISTINCT o.id)::int                AS client_orders_cnt_26w,
    SUM(oi.quantity)::int                    AS client_qty_26w,
    MAX(o."createdAt")                       AS last_buy_at
  FROM "order_items" oi
  JOIN "orders" o ON o.id = oi."orderId"
  JOIN bounds b ON TRUE
  WHERE o."clientId" = b.client_id
    AND o."distributorId" = b.distributor_id
    AND o.status IN ('CONFIRMED','IN_PREPARATION','IN_TRANSIT','DELIVERED')
    AND o."paymentStatus" <> 'REJECTED'
    AND o."createdAt" >= b.since_client AND o."createdAt" <= b.as_of
  GROUP BY oi."productId"
),
-- 3) Popularidad global del distribuidor en 1 año (ligero)
global_stats AS (
  SELECT
    oi."productId"                           AS product_id,
    COUNT(DISTINCT o.id)::int                AS global_orders_cnt_1y,
    COUNT(DISTINCT o."clientId")::int        AS global_buyers_cnt_1y,
    SUM(oi.quantity)::int                    AS global_qty_1y
  FROM "order_items" oi
  JOIN "orders" o ON o.id = oi."orderId"
  JOIN bounds b ON TRUE
  WHERE o."distributorId" = b.distributor_id
    AND o.status IN ('CONFIRMED','IN_PREPARATION','IN_TRANSIT','DELIVERED')
    AND o."paymentStatus" <> 'REJECTED'
    AND o."createdAt" >= b.since_global AND o."createdAt" <= b.as_of
  GROUP BY oi."productId"
),
-- 4) Stock y vencimiento (por producto)
stock AS (
  SELECT
    ii."productId"                            AS product_id,
    SUM(ii.stock)::int                        AS stock_total,
    MIN(CEIL(EXTRACT(EPOCH FROM (ii."expirationDate" - b.as_of)) / 86400))::int AS min_days_to_expiry
  FROM "inventory_items" ii
  JOIN bounds b ON TRUE
  GROUP BY ii."productId"
),
-- 5) Novedades (productos activos creados últimos 90 días)
novelty AS (
  SELECT p.id AS product_id
  FROM "products" p
  JOIN bounds b ON TRUE
  WHERE p."distributorId" = b.distributor_id
    AND p."isActive" = TRUE
    AND p."createdAt" >= b.since_new AND p."createdAt" <= b.as_of
),
-- 6) Buckets de candidatos (mix simple: historial, top global, novedades)
bucket_history AS (
  -- historial del cliente, evitando repetir si compró hace < avoid_repeat_days
  SELECT ci.product_id
  FROM client_items ci
  JOIN bounds b ON TRUE
  WHERE NOT (ci.last_buy_at >= b.since_avoid)
),
bucket_global AS (
  SELECT gs.product_id
  FROM global_stats gs
  JOIN "products" p ON p.id = gs.product_id
  JOIN bounds b ON TRUE
  WHERE p."distributorId" = b.distributor_id AND p."isActive" = TRUE
  ORDER BY gs.global_orders_cnt_1y DESC
  LIMIT (SELECT top_global_limit FROM params)
),
bucket_new AS (
  SELECT n.product_id
  FROM novelty n
  LIMIT (SELECT top_new_limit FROM params)
),
candidates AS (
  SELECT DISTINCT product_id FROM (
    SELECT product_id FROM bucket_history
    UNION
    SELECT product_id FROM bucket_global
    UNION
    SELECT product_id FROM bucket_new
  ) u
)
-- 7) Ensamble final con features
SELECT
  p.id                                AS product_id,
  p.sku,
  p.name,
  p.price::numeric(10,2)              AS price,

  -- features para la IA:
  COALESCE(ci.client_orders_cnt_26w,0)::int AS f_client_orders_cnt_26w,
  COALESCE(ci.client_qty_26w,0)::int        AS f_client_qty_26w,
  ci.last_buy_at                            AS f_last_buy_at,
  (ci.product_id IS NOT NULL)               AS f_client_bought_before,

  COALESCE(gs.global_orders_cnt_1y,0)::int  AS f_global_orders_cnt_1y,
  COALESCE(gs.global_buyers_cnt_1y,0)::int  AS f_global_buyers_cnt_1y,
  COALESCE(gs.global_qty_1y,0)::int         AS f_global_qty_1y,

  (n.product_id IS NOT NULL)                AS f_is_new,

  COALESCE(s.stock_total,0)::int            AS f_stock_total,
  s.min_days_to_expiry                      AS f_min_days_to_expiry,
  (COALESCE(s.stock_total,0) > 0)           AS f_has_stock,
  (s.min_days_to_expiry IS NOT NULL AND s.min_days_to_expiry < (SELECT min_expiry_days FROM params)) AS f_expiring_soon

FROM candidates c
JOIN "products" p ON p.id = c.product_id
JOIN bounds b ON TRUE
LEFT JOIN client_items  ci ON ci.product_id = p.id
LEFT JOIN global_stats  gs ON gs.product_id = p.id
LEFT JOIN stock         s  ON s.product_id  = p.id
LEFT JOIN novelty       n  ON n.product_id  = p.id
WHERE p."distributorId" = b.distributor_id
  AND p."isActive" = TRUE
ORDER BY
  -- orden heurístico liviano (podés ignorarlo y que ordene la IA)
  (CASE WHEN n.product_id IS NOT NULL THEN 1 ELSE 0 END) DESC,
  COALESCE(gs.global_orders_cnt_1y,0)::int DESC,
  COALESCE(ci.client_qty_26w,0)::int DESC
;
