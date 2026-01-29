-- --- LIKES SYSTEM & GAMIFICATION ---

create table if not exists public.post_likes (
  user_id uuid references public.profiles(id) not null,
  post_id uuid references public.posts(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, post_id)
);

alter table public.post_likes enable row level security;

-- Policies
drop policy if exists "Likes are viewable by everyone." on public.post_likes;
create policy "Likes are viewable by everyone." on public.post_likes for select using (true);

drop policy if exists "Users can manage their own likes." on public.post_likes;
create policy "Users can manage their own likes." on public.post_likes for all using (auth.uid() = user_id);

-- FUNCTION: Toggle Like (Handles Logic Atomically)
-- 1. Checks if like exists
-- 2. Inserts or Deletes like
-- 3. Updates posts.likes_count
-- 4. Updates profiles.points (Gamification: +1 point if not self-like)

create or replace function public.toggle_like(p_post_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_author_id uuid;
  v_liked boolean;
  v_new_count integer;
begin
  -- Get current user
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Get post author
  select user_id into v_author_id from public.posts where id = p_post_id;
  if v_author_id is null then
    raise exception 'Post not found';
  end if;

  -- Check if already liked
  if exists (select 1 from public.post_likes where user_id = v_user_id and post_id = p_post_id) then
    -- UNLIKE
    delete from public.post_likes where user_id = v_user_id and post_id = p_post_id;
    
    -- Decrement post count
    update public.posts set likes_count = likes_count - 1 where id = p_post_id
    returning likes_count into v_new_count;

    -- Decrement author points (ONLY if not self-like and points > 0)
    if v_user_id != v_author_id then
      update public.profiles set points = greatest(0, points - 1) where id = v_author_id;
    end if;

    v_liked := false;
  else
    -- LIKE
    insert into public.post_likes (user_id, post_id) values (v_user_id, p_post_id);
    
    -- Increment post count
    update public.posts set likes_count = likes_count + 1 where id = p_post_id
    returning likes_count into v_new_count;

    -- Increment author points (ONLY if not self-like)
    -- RULE: You don't get points for liking your own post
    if v_user_id != v_author_id then
      update public.profiles set points = points + 1 where id = v_author_id;
    end if;

    v_liked := true;
  end if;

  return json_build_object('liked', v_liked, 'new_count', v_new_count);
end;
$$;
