-- MIGRATION: Deduplicate Clients and Add Constraints
-- Description: Removes duplicate clients (keeping one) and adds unique index.

-- 1. Create a temporary table to store IDs to keep
CREATE TEMP TABLE clients_to_keep AS
SELECT DISTINCT ON (name, user_id) id
FROM public.clients
ORDER BY name, user_id, created_at ASC;

-- 2. Move transactions from duplicate clients to the one we are keeping
-- (Optional but safer: if duplicates were used, merge them first)
-- Logic: find all duplicates, update their transactions to point to the 'keep' ID

DO $$ 
DECLARE
    r RECORD;
    keep_id UUID;
BEGIN
    FOR r IN 
        SELECT c.id, c.name, c.user_id 
        FROM public.clients c
        WHERE c.id NOT IN (SELECT id FROM clients_to_keep)
    LOOP
        -- Find the ID we are keeping for this name/user
        SELECT id INTO keep_id 
        FROM public.clients 
        WHERE name = r.name AND user_id = r.user_id 
        AND id IN (SELECT id FROM clients_to_keep)
        LIMIT 1;

        IF keep_id IS NOT NULL THEN
            -- Update transactions
            UPDATE public.transactions 
            SET client_id = keep_id 
            WHERE client_id = r.id;
        END IF;
    END LOOP;
END $$;

-- 3. Delete duplicates
DELETE FROM public.clients
WHERE id NOT IN (SELECT id FROM clients_to_keep);

-- 4. Add Unique Constraint to prevent future duplicates
ALTER TABLE public.clients
ADD CONSTRAINT unique_client_name_per_user UNIQUE (name, user_id);

-- Drop temp table for clients
DROP TABLE clients_to_keep;

-- ==========================================
-- 5. DEDUPLICATE PRODUCTS
-- ==========================================

-- Create temp table for products to keep
CREATE TEMP TABLE products_to_keep AS
SELECT DISTINCT ON (name, user_id) id
FROM public.products
ORDER BY name, user_id, created_at ASC;

-- Delete duplicate products
DELETE FROM public.products
WHERE id NOT IN (SELECT id FROM products_to_keep);

-- Add Unique Constraint for products
ALTER TABLE public.products
ADD CONSTRAINT unique_product_name_per_user UNIQUE (name, user_id);

-- Drop temp table for products
DROP TABLE products_to_keep;
