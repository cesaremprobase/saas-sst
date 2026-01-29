-- Enable RLS
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;

-- --- PROFILES ---
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  avatar_url text,
  points integer default 0,
  role text default 'user', -- 'user' | 'admin'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.profiles enable row level security;

-- Policies (Drop first to allow re-runs)
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
drop policy if exists "Users can insert their own profile." on public.profiles;
drop policy if exists "Users can update own profile." on public.profiles;

create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- --- COURSES ---
create table if not exists public.courses (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  points_reward integer default 0,
  image_url text,
  is_new boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.courses enable row level security;

drop policy if exists "Courses are viewable by everyone." on public.courses;
create policy "Courses are viewable by everyone." on public.courses for select using (true);

-- --- USER PROGRESS ---
create table if not exists public.user_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  course_id uuid references public.courses(id) not null,
  progress integer default 0, -- 0 to 100
  status text default 'not_started', -- 'not_started' | 'in_progress' | 'completed'
  last_accessed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, course_id)
);
alter table public.user_progress enable row level security;

drop policy if exists "Users can view own progress." on public.user_progress;
drop policy if exists "Users can insert own progress." on public.user_progress;
drop policy if exists "Users can update own progress." on public.user_progress;

create policy "Users can view own progress." on public.user_progress for select using (auth.uid() = user_id);
-- FIX: Changed name to be unique (vs update policy)
create policy "Users can insert own progress." on public.user_progress for insert with check (auth.uid() = user_id);
create policy "Users can update own progress." on public.user_progress for update using (auth.uid() = user_id);

-- --- GAMIFICATION (Rewards & Redemptions) ---

create table if not exists public.rewards (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  cost integer not null, -- Costo en puntos
  image_url text,
  stock integer default -1, -- -1 = infinito
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.rewards enable row level security;
drop policy if exists "Rewards are viewable by everyone." on public.rewards;
create policy "Rewards are viewable by everyone." on public.rewards for select using (true);

create table if not exists public.redemptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  reward_id uuid references public.rewards(id) not null,
  status text default 'pending', -- 'pending' | 'approved' | 'rejected'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.redemptions enable row level security;
drop policy if exists "Users can view own redemptions." on public.redemptions;
drop policy if exists "Users can create redemptions." on public.redemptions;
create policy "Users can view own redemptions." on public.redemptions for select using (auth.uid() = user_id);
create policy "Users can create redemptions." on public.redemptions for insert with check (auth.uid() = user_id);

-- --- SEED DATA (Safe Insert) ---
insert into public.courses (title, description, points_reward, image_url, is_new)
select 'Fundamentos de Seguridad Industrial', 'Aprende los principios básicos para mantenerte seguro en planta y oficinas.', 150, 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2670&auto=format&fit=crop', true
where not exists (select 1 from public.courses where title = 'Fundamentos de Seguridad Industrial');

insert into public.courses (title, description, points_reward, image_url, is_new)
select 'Manejo de Extintores Nivel 1', 'Protocolos de emergencia y uso correcto de equipos contra incendios.', 300, 'https://images.unsplash.com/photo-1582148453488-84ddfb824a74?q=80&w=2670&auto=format&fit=crop', false
where not exists (select 1 from public.courses where title = 'Manejo de Extintores Nivel 1');

insert into public.courses (title, description, points_reward, image_url, is_new)
select 'Primeros Auxilios: Protocolo RCP', 'Guía oficial para respuesta inmediata ante paros cardiorrespiratorios.', 250, 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2670&auto=format&fit=crop', false
where not exists (select 1 from public.courses where title = 'Primeros Auxilios: Protocolo RCP');

insert into public.rewards (title, description, cost, image_url)
select 'Medio día libre', 'Disfruta de una tarde libre para tus trámites o descanso.', 1000, 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?q=80&w=2574&auto=format&fit=crop'
where not exists (select 1 from public.rewards where title = 'Medio día libre');

insert into public.rewards (title, description, cost, image_url)
select 'Salida Temprana (2hrs)', 'Sal 2 horas antes de tu hora habitual.', 500, 'https://images.unsplash.com/photo-1495147466023-ac5c588e2e94?q=80&w=2574&auto=format&fit=crop'
where not exists (select 1 from public.rewards where title = 'Salida Temprana (2hrs)');

insert into public.rewards (title, description, cost, image_url)
select 'Desayuno Gratis', 'Vale por un desayuno completo en la cafetería.', 200, 'https://images.unsplash.com/photo-1493770348161-369560ae357d?q=80&w=2670&auto=format&fit=crop'
where not exists (select 1 from public.rewards where title = 'Desayuno Gratis');
