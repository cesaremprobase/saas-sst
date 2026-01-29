-- Enable Storage
-- NOTE: This usually requires enabling the extension in the dashboard, but we can try to create the bucket.

insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

-- Policies for 'images' bucket

-- 1. Everyone can view images
drop policy if exists "Public Access" on storage.objects;
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'images' );

-- 2. Authenticated users can upload images
drop policy if exists "Auth Users Upload" on storage.objects;
create policy "Auth Users Upload"
on storage.objects for insert
with check (
  bucket_id = 'images'
  and auth.role() = 'authenticated'
);

-- 3. Users can update/delete their own images (Optional, good for cleanup)
drop policy if exists "Users Manage Own Images" on storage.objects;
create policy "Users Manage Own Images"
on storage.objects for all
using (
  bucket_id = 'images'
  and auth.uid() = owner
);
