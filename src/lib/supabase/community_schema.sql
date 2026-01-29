-- --- COMMUNITY (Posts) ---

create table if not exists public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  content text not null,
  image_url text, -- Opcional
  link_url text, -- Opcional (YouTube, Loom, etc.)
  likes_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.posts enable row level security;

-- Policies
drop policy if exists "Posts are viewable by everyone." on public.posts;
create policy "Posts are viewable by everyone." on public.posts for select using (true);

drop policy if exists "Users can insert their own posts." on public.posts;
create policy "Users can insert their own posts." on public.posts for insert with check (auth.uid() = user_id);

-- Optional: Allow users to delete their own posts
drop policy if exists "Users can delete their own posts." on public.posts;
create policy "Users can delete their own posts." on public.posts for delete using (auth.uid() = user_id);
