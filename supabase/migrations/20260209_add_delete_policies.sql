-- Migration: Add DELETE policies for Clients and Products
-- Description: Allows users to delete their own clients and products.

-- 1. Policies for CLIENTS
CREATE POLICY "Users can delete their own clients" ON public.clients
  FOR DELETE USING (auth.uid() = user_id);

-- 2. Policies for PRODUCTS
CREATE POLICY "Users can delete their own products" ON public.products
  FOR DELETE USING (auth.uid() = user_id);
