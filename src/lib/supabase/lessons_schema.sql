-- Create lessons table
create table if not exists public.lessons (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  description text,
  video_url text, -- YouTube or Storage URL
  section text default 'Módulo 1', -- Grouping
  order_index integer default 0,
  duration integer default 0, -- in minutes
  is_published boolean default true,
  is_preview boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.lessons enable row level security;

-- Policies
create policy "Lessons are viewable by everyone" on public.lessons for select using (true);

create policy "Admins can insert lessons" on public.lessons
for insert with check (
  exists ( select 1 from public.profiles where id = auth.uid() and role = 'admin' )
);

create policy "Admins can update lessons" on public.lessons
for update using (
  exists ( select 1 from public.profiles where id = auth.uid() and role = 'admin' )
);

create policy "Admins can delete lessons" on public.lessons
for delete using (
  exists ( select 1 from public.profiles where id = auth.uid() and role = 'admin' )
);

-- Update user_progress to track completed lessons (Array approach for simplicity in Upgrade)
-- We add a column to store which lessons are completed in a specific course
alter table public.user_progress add column if not exists completed_lessons uuid[] default '{}';
alter table public.user_progress add column if not exists last_lesson_id uuid;

-- Function to complete a lesson
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
    
    -- Safety check for empty course
    if v_total_lessons = 0 then
        return query select true, false, 'No lessons in course';
        return;
    end if;

    -- Reload record to get updated array
    select * into v_progress_record from public.user_progress where id = v_progress_record.id;
    v_completed_count := array_length(v_progress_record.completed_lessons, 1);
    
    -- Update percentage
    update public.user_progress
    set progress = (v_completed_count::float / v_total_lessons::float * 100)::integer
    where id = v_progress_record.id;

    -- 3. Check specific course completion logic (if 100%)
    if (v_completed_count::float / v_total_lessons::float * 100)::integer >= 100 and v_progress_record.status != 'completed' then
       -- Trigger the existing complete_course logic if needed, or just mark status
       update public.user_progress set status = 'completed' where id = v_progress_record.id;
       
       -- Award Points (Re-using logic from complete_course function via simple call if possible, or direct update)
       -- For now, let's just assume the UI calls the legacy complete_course OR we rely on this function returning 'course_completed' true
       return query select true, true, 'Lesson completed and Course finished!';
    else
       return query select true, false, 'Lesson completed';
    end if;
end;
$$;
