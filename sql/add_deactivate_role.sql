
-- Step 1: Drop the existing constraint if it exists.
-- The constraint name might vary, check your table definition. Common default is 'profiles_role_check'.
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Step 2: Add the new constraint that includes the 'nonaktif' role.
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'kolektor', 'nonaktif'));
