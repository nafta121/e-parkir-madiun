-- 1. DROP the Trigger and Function
-- This stops the database from trying to create a profile automatically (which was failing silently).
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user;

-- 2. Ensure Profiles Table structure is correct
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  role text default 'kolektor' check (role in ('admin', 'kolektor')),
  created_at timestamptz default now()
);

-- 3. DISABLE Row Level Security (RLS) on Profiles (TEMPORARY FOR DEBUGGING)
-- This ensures there are NO permission errors when the frontend tries to insert the profile.
alter table public.profiles disable row level security;

-- Note: In production, you should re-enable RLS and add an INSERT policy:
-- create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);
