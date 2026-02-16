-- 1. Create Profiles Table to manage Roles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  role text default 'kolektor' check (role in ('admin', 'kolektor')),
  created_at timestamptz default now()
);

-- 2. Enable RLS on Profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- 3. Trigger to handle new user signup automatically
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'kolektor');
  return new;
end;
$$;

-- Drop trigger if exists to avoid duplication errors during re-runs
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Update Transactions Table to track WHO input the data
-- We need this to allow "Kolektor sees own data"
alter table public.transactions 
add column if not exists user_id uuid references auth.users(id);

-- 5. Enable RLS on Transactions
alter table public.transactions enable row level security;

-- Policy: Admin sees all, Kolektor sees only their own inputs
create policy "Admin sees all transactions"
  on transactions
  for select
  using ( 
    exists (
      select 1 from profiles 
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Kolektor sees own transactions"
  on transactions
  for select
  using ( 
    auth.uid() = user_id
  );

create policy "Users can insert their own transactions"
  on transactions
  for insert
  with check ( 
    auth.uid() = user_id
  );

create policy "Admin can update/delete transactions"
  on transactions
  for all
  using (
    exists (
      select 1 from profiles 
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- 6. Secure Legacy Tables (DataPagi / DataMalam)
alter table "DataPagi" enable row level security;
alter table "DataMalam" enable row level security;

-- Policy for DataPagi
create policy "Read access for authenticated users"
  on "DataPagi" for select
  to authenticated
  using (true);

create policy "Full access for admins"
  on "DataPagi" for all
  using (
    exists (
      select 1 from profiles 
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Policy for DataMalam
create policy "Read access for authenticated users"
  on "DataMalam" for select
  to authenticated
  using (true);

create policy "Full access for admins"
  on "DataMalam" for all
  using (
    exists (
      select 1 from profiles 
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- 7. AUTO-PROMOTE SUPER ADMIN
-- This runs every time this script is executed to ensure access
do $$
begin
  -- Update profile role if the user exists in auth.users
  update public.profiles
  set role = 'admin'
  where email = 'naftalyndho@gmail.com';
  
  -- If the profile doesn't exist yet (user signed up before trigger), insert it manually
  insert into public.profiles (id, email, role)
  select id, email, 'admin'
  from auth.users
  where email = 'naftalyndho@gmail.com'
  on conflict (id) do update set role = 'admin';
end
$$;