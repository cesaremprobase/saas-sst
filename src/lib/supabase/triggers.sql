-- 1. Función que se ejecuta cuando se crea un usuario en auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url',
    'user' -- Rol por defecto
  );
  return new;
end;
$$;

-- 2. Crear el Trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. REPARAR USUARIOS EXISTENTES (Backfill)
-- Ejecuta esto para crear perfiles para los usuarios que ya se registraron pero no tienen perfil
insert into public.profiles (id, full_name, role)
select id, raw_user_meta_data->>'full_name', 'user'
from auth.users
where id not in (select id from public.profiles);
