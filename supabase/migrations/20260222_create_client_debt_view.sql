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

-- Enable RLS on the view
ALTER VIEW public.client_debt SET (security_barrier = true);

-- Create policy for the view
CREATE POLICY "Users can view own client_debt or Admin can view all" ON public.client_debt
FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_debt.id AND c.user_id = auth.uid())
);
