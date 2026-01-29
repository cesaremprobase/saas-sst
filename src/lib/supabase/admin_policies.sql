-- Enable RLS (just in case)
alter table public.courses enable row level security;
alter table public.rewards enable row level security;

-- --- COURSES POLICIES ---

create policy "Admins can insert courses" on public.courses
for insert with check (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

create policy "Admins can update courses" on public.courses
for update using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

create policy "Admins can delete courses" on public.courses
for delete using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

-- --- REWARDS POLICIES ---

create policy "Admins can insert rewards" on public.rewards
for insert with check (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

create policy "Admins can update rewards" on public.rewards
for update using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

create policy "Admins can delete rewards" on public.rewards
for delete using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);
