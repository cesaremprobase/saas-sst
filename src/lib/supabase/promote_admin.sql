-- Reemplaza 'EMAIL_DEL_USUARIO' con el email del usuario que quieres hacer administrador
-- Ejemplo: update public.profiles set role = 'admin' where id in (select id from auth.users where email = 'admin@zgas.com');

UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id 
  FROM auth.users 
  WHERE email = 'EMAIL_DEL_USUARIO' -- Pon aquí el correo
);

-- Verificar el cambio
SELECT * FROM public.profiles WHERE role = 'admin';
