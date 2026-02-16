import { createClient } from '@supabase/supabase-js';

// Safely access import.meta.env. If it doesn't exist (e.g. not processed by Vite), default to an empty object.
// This prevents "Cannot read properties of undefined" errors.
const metaEnv = (import.meta as any).env || {};

const SUPABASE_URL = metaEnv.VITE_SUPABASE_URL || 'https://bjznjmrtvnccuzxebzjv.supabase.co';
const SUPABASE_ANON_KEY = metaEnv.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqem5qbXJ0dm5jY3V6eGViemp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNzg2OTcsImV4cCI6MjA4NDc1NDY5N30.0UbCrXKZFhE6r-92yb5JGO2H1v2-aI3jIKnBuQft3dg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);