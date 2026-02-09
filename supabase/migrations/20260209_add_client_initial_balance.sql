-- Migration: Add Initial Balance to Clients
-- Description: Allows setting a starting debt for clients.

ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS initial_balance DECIMAL(10,2) DEFAULT 0.00;

-- Comment
COMMENT ON COLUMN public.clients.initial_balance IS 'Starting debt before any recorded transactions.';
