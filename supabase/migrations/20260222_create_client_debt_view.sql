-- Migration: 20260222_create_client_debt_view
-- Description: add view that aggregates client debt to avoid expensive JS calculations in the browser

-- drop existing view if exists (idempotent)
DROP VIEW IF EXISTS public.client_debt;

CREATE VIEW public.client_debt AS
SELECT
  c.id,
  c.name,
  c.order_index,
  c.initial_balance,
  COALESCE(
    SUM(
      CASE
        WHEN t.type = 'DELIVERY' THEN t.amount
        WHEN t.type = 'PAYMENT' THEN -t.amount
        ELSE 0
      END
    ), 0
  ) AS debt
FROM public.clients c
LEFT JOIN public.transactions t ON t.client_id = c.id
GROUP BY c.id, c.name, c.order_index, c.initial_balance;
