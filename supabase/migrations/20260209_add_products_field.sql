-- Migration: Add Products Column to Transactions
-- Description: Adds a JSONB column to store product quantities (PAN, MOLDE, etc.)

ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS products JSONB DEFAULT '{}'::jsonb;

-- Comment for documentation
COMMENT ON COLUMN public.transactions.products IS 'Stores product quantities e.g. {"PAN": 10, "MOLDE": 2}';
