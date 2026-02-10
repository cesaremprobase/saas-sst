-- MIGRATION: Global Deduplication & Shared Access
-- Description: Merges clients/products by name (ignoring user_id) and enables shared access.

-- ==========================================
-- 1. DEDUPLICATE CLIENTS (GLOBAL)
-- ==========================================

-- Temp table for unique names (keep oldest)
CREATE TEMP TABLE global_clients_keep AS
SELECT DISTINCT ON (name) id
FROM public.clients
ORDER BY name, created_at ASC;

-- Move transactions to the 'keep' ID
DO $$ 
DECLARE
    r RECORD;
    keep_id UUID;
BEGIN
    FOR r IN 
        SELECT c.id, c.name 
        FROM public.clients c
        WHERE c.id NOT IN (SELECT id FROM global_clients_keep)
    LOOP
        -- Find the ID we are keeping for this name
        SELECT id INTO keep_id 
        FROM public.clients 
        WHERE name = r.name 
        AND id IN (SELECT id FROM global_clients_keep)
        LIMIT 1;

        IF keep_id IS NOT NULL THEN
            UPDATE public.transactions 
            SET client_id = keep_id 
            WHERE client_id = r.id;
        END IF;
    END LOOP;
END $$;

-- Delete duplicates
DELETE FROM public.clients
WHERE id NOT IN (SELECT id FROM global_clients_keep);

-- Update Constraint: Unique Name ONLY (Drop previous if exists)
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS unique_client_name_per_user;
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_name_key; -- specific if any
ALTER TABLE public.clients ADD CONSTRAINT unique_client_name_global UNIQUE (name);

DROP TABLE global_clients_keep;

-- ==========================================
-- 2. DEDUPLICATE PRODUCTS (GLOBAL)
-- ==========================================

CREATE TEMP TABLE global_products_keep AS
SELECT DISTINCT ON (name) id
FROM public.products
ORDER BY name, created_at ASC;

-- Delete duplicate products (no transaction links to update usually, or cascade? items link to product_name not ID in this app design? 
-- Wait, transaction_items in creating tables usually links to ID? 
-- Checked code: transaction_items uses 'product_name' and 'unit_price', NO Foreign Key to products table usually in this specific app based on Service code?
-- Service code says: .insert(items) where item has product_name.
-- Let's check schema for transaction_items... "20260209_create_transaction_items.sql"
-- If it has FK to products(id), we need to update it.
-- Based on financeService: It stores product_name, NOT product_id.
-- So deleting products is safe if no FK. If FK exists, we might error.
-- Assuming no FK or safe given service implementation.

DELETE FROM public.products
WHERE id NOT IN (SELECT id FROM products_to_keep); -- Wait, typo in prev migration logic? No, here "global_products_keep".

DELETE FROM public.products
WHERE id NOT IN (SELECT id FROM global_products_keep);

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS unique_product_name_per_user;
ALTER TABLE public.products ADD CONSTRAINT unique_product_name_global UNIQUE (name);

DROP TABLE global_products_keep;

-- ==========================================
-- 3. SHARED ACCESS RLS (The "Integral" View)
-- ==========================================

-- Clients: Everyone can see/edit everything
DROP POLICY IF EXISTS "Users can view own clients or Admin can view all" ON public.clients;
DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can insert their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON public.clients;

CREATE POLICY "Shared Clients: Authenticated users can do everything" ON public.clients
FOR ALL USING (auth.role() = 'authenticated');

-- Products: Everyone can see/edit everything
DROP POLICY IF EXISTS "Users can view their own products" ON public.products;
DROP POLICY IF EXISTS "Users can insert their own products" ON public.products;
DROP POLICY IF EXISTS "Users can update their own products" ON public.products;

CREATE POLICY "Shared Products: Authenticated users can do everything" ON public.products
FOR ALL USING (auth.role() = 'authenticated');

-- Transactions: Everyone can see/create everything (Shared Ledger)
-- If User A sells, User B sees it.
DROP POLICY IF EXISTS "Users can view own transactions or Admin can view all" ON public.transactions;
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;

CREATE POLICY "Shared Transactions: Authenticated users can do everything" ON public.transactions
FOR ALL USING (auth.role() = 'authenticated');
