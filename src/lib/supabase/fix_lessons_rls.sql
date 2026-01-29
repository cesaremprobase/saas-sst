-- FIX: Reset policies for lessons table
-- Run this in Supabase SQL Editor

-- 1. Drop existing policies to avoid conflicts
drop policy if exists "Lessons are viewable by everyone" on public.lessons;
drop policy if exists "Admins can insert lessons" on public.lessons;
drop policy if exists "Admins can update lessons" on public.lessons;
drop policy if exists "Admins can delete lessons" on public.lessons;

-- 2. Ensure RLS is enabled
alter table public.lessons enable row level security;

-- 3. Re-create Policies

-- READ: Everyone can see lessons
create policy "Lessons are viewable by everyone" 
on public.lessons for select 
using (true);

-- WRITE: Only Admins can insert
create policy "Admins can insert lessons" 
on public.lessons for insert 
with check (
  exists ( 
    select 1 from public.profiles 
    where id = auth.uid() and role = 'admin' 
  )
);

-- UPDATE: Only Admins can update
create policy "Admins can update lessons" 
on public.lessons for update 
using (
  exists ( 
    select 1 from public.profiles 
    where id = auth.uid() and role = 'admin' 
  )
);

-- DELETE: Only Admins can delete
create policy "Admins can delete lessons" 
on public.lessons for delete 
using (
  exists ( 
    select 1 from public.profiles 
    where id = auth.uid() and role = 'admin' 
  )
);
