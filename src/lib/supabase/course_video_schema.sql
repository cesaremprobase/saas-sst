-- Add video_url column to courses table if it doesn't exist
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'courses' and column_name = 'video_url') then
        alter table public.courses add column video_url text;
    end if;
end $$;

-- Function to handle course completion and point awarding
create or replace function public.complete_course(
    p_course_id uuid,
    p_user_id uuid
)
returns table (
    success boolean,
    points_awarded integer,
    message text
)
language plpgsql
security definer
as $$
declare
    v_course_points integer;
    v_status text;
begin
    -- 1. Check if course exists and get points
    select points_reward into v_course_points from public.courses where id = p_course_id;
    if v_course_points is null then
        return query select false, 0, 'Course not found';
        return;
    end if;

    -- 2. Check current status
    select status into v_status from public.user_progress 
    where user_id = p_user_id and course_id = p_course_id;

    -- 3. If already completed, do nothing but return success
    if v_status = 'completed' then
        return query select true, 0, 'Already completed';
        return;
    end if;

    -- 4. Upsert progress (mark as completed)
    insert into public.user_progress (user_id, course_id, progress, status, last_accessed_at)
    values (p_user_id, p_course_id, 100, 'completed', now())
    on conflict (user_id, course_id) 
    do update set 
        progress = 100, 
        status = 'completed', 
        last_accessed_at = now();

    -- 5. Award points to profile
    update public.profiles
    set points = points + v_course_points
    where id = p_user_id;

    return query select true, v_course_points, 'Course completed successfully';
end;
$$;
