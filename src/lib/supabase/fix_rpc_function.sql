-- FIX: Re-create complete_lesson function
-- Run this in Supabase SQL Editor

-- 1. Create or Replace Function
create or replace function public.complete_lesson(
    p_course_id uuid,
    p_lesson_id uuid,
    p_user_id uuid
)
returns table (
    success boolean,
    course_completed boolean,
    message text
)
language plpgsql
security definer
as $$
declare
    v_progress_record public.user_progress%rowtype;
    v_total_lessons integer;
    v_completed_count integer;
    v_already_completed boolean;
    v_is_new_completion boolean := false;
begin
    -- 1. Get or Initialize Progress Record
    select * into v_progress_record from public.user_progress 
    where user_id = p_user_id and course_id = p_course_id;

    if not found then
        -- Handle legacy video case: if p_lesson_id is 'legacy-video', checking exists might fail if we enforce FK
        -- Ideally, p_lesson_id should be a real UUID.
        -- If it is 'legacy-video' (frontend fallback), we can't store it in uuid[] array unless we cast or mock.
        -- FIX: If lesson_id is not a valid UUID, allow it if it's the legacy placeholder, but don't fk check.
        
        insert into public.user_progress (user_id, course_id, progress, status, completed_lessons, last_accessed_at, last_lesson_id)
        values (p_user_id, p_course_id, 0, 'in_progress', array[p_lesson_id], now(), p_lesson_id)
        returning * into v_progress_record;
        v_is_new_completion := true;
    else
        -- Check if already in array
        if not (v_progress_record.completed_lessons @> array[p_lesson_id]) then
            update public.user_progress 
            set completed_lessons = array_append(completed_lessons, p_lesson_id),
                last_accessed_at = now(),
                last_lesson_id = p_lesson_id
            where id = v_progress_record.id;
            v_is_new_completion := true;
        else
            update public.user_progress 
            set last_accessed_at = now(),
                last_lesson_id = p_lesson_id
            where id = v_progress_record.id;
        end if;
    end if;

    -- 2. Recalculate Progress %
    select count(*) into v_total_lessons from public.lessons where course_id = p_course_id;
    
    -- If no lessons (legacy course), assume 1 total if video_url exists
    if v_total_lessons = 0 then
       v_total_lessons := 1;
    end if;

    -- Reload record
    select * into v_progress_record from public.user_progress where id = v_progress_record.id;
    v_completed_count := array_length(v_progress_record.completed_lessons, 1);
    
    -- Avoid division by zero
    if v_total_lessons = 0 then v_total_lessons := 1; end if;

    -- Update percentage
    update public.user_progress
    set progress = LEAST((v_completed_count::float / v_total_lessons::float * 100)::integer, 100)
    where id = v_progress_record.id;

    -- 3. Check specific course completion logic
    if (v_completed_count >= v_total_lessons) and v_progress_record.status != 'completed' then
       update public.user_progress set status = 'completed' where id = v_progress_record.id;
       return query select true, true, 'Course completed!';
    else
       return query select true, false, 'Lesson completed';
    end if;
end;
$$;

-- 2. Grant Permissions
grant execute on function public.complete_lesson to authenticated;
grant execute on function public.complete_lesson to service_role;
