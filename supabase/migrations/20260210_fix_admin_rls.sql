-- Migration: Fix Admin RLS and Add Timezone Function
-- Description: Allows admins to view all transactions and clients.

-- 1. DROP EXISTING POLICIES (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;

-- 2. CREATE NEW POLICIES FOR TRANSACTIONS
CREATE POLICY "Users can view own transactions or Admin can view all" ON public.transactions
FOR SELECT USING (
  auth.uid() = user_id 
  OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Keep insert/update/delete restricted to own data for now (or open if needed)
-- For this app, admins usually just VIEW. If they need to edit, update here.

-- 3. CREATE NEW POLICIES FOR CLIENTS
CREATE POLICY "Users can view own clients or Admin can view all" ON public.clients
FOR SELECT USING (
  auth.uid() = user_id 
  OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
