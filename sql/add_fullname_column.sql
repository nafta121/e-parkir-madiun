-- Run this in Supabase SQL Editor
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name text;
