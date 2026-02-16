-- 1. Add full_name column if it doesn't exist
alter table public.profiles 
add column if not exists full_name text;

-- 2. Enable pgcrypto extension for password hashing
create extension if not exists pgcrypto;

-- 3. Create the Secure RPC Function
-- This function runs with 'postgres' permissions (SECURITY DEFINER)
-- allowing it to insert into the protected auth.users table.
create or replace function public.create_kolektor_user(
  new_email text,
  new_password text,
  new_fullname text
)
returns uuid
language plpgsql
security definer -- Critical: Runs as superuser/creator
set search_path = public, auth, extensions -- Secure search path
as $$
declare
  new_user_id uuid;
  check_role text;
  existing_id uuid;
begin
  -- A. Check if the caller is an Admin
  -- We use the profiles table to verify the role of the user calling this function
  select role into check_role from public.profiles where id = auth.uid();
  
  if check_role is distinct from 'admin' then
    raise exception 'Unauthorized: Only admins can create users.';
  end if;

  -- B. Check if email already exists
  select id into existing_id from auth.users where email = new_email;
  if existing_id is not null then
    raise exception 'Email already registered.';
  end if;

  -- C. Create the user in auth.users
  -- We manually generate a UUID and insert into the system table.
  -- The password is hashed using crypt() from pgcrypto.
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  )
  values (
    '00000000-0000-0000-0000-000000000000', -- Default Supabase Instance ID
    gen_random_uuid(),
    'authenticated',
    'authenticated', -- Supabase auth role
    new_email,
    crypt(new_password, gen_salt('bf')), -- Hash the password securely
    now(), -- Auto-confirm the email
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object('full_name', new_fullname), -- Store name in metadata
    now(),
    now(),
    '', -- Empty tokens prevents email sending
    ''
  )
  returning id into new_user_id;

  -- D. Update the public.profiles table
  -- The trigger 'on_auth_user_created' will have already run and created the row,
  -- but we need to update the full_name.
  update public.profiles
  set full_name = new_fullname
  where id = new_user_id;

  return new_user_id;
end;
$$;
