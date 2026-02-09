-- Migration: Seed Products
-- Description: Clears existing products and inserts the official price list.

-- 1. Clear existing products to avoid duplicates
TRUNCATE TABLE public.products;

-- 2. Insert new products with correct prices
-- Note: usage of auth.uid() in policies usually prevents direct SQL insert without a user context if RLS is strict.
-- However, in SQL Editor, we often run as postgres/service_role which bypasses RLS.
-- If running as a specific user is needed, we might need a different approach, but usually for seeding config data this works.

INSERT INTO public.products (name, price, user_id)
VALUES 
  ('PAN', 1.00, auth.uid()),
  ('MOLDE', 1.70, auth.uid()),
  ('BIZCOCHO', 1.20, auth.uid()),
  ('KEKE', 5.00, auth.uid()),
  ('KINGKONG', 5.00, auth.uid()),
  ('ALFAJOR', 10.00, auth.uid());

-- NOTE: If the above fails due to auth.uid() being null in the SQL Editor:
-- You can manually replace `auth.uid()` with your specific User ID string found in the Authentication tab.
