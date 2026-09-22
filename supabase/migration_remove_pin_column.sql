-- ============================================================================
-- SmartPrint: Remove plaintext PIN column from shops table
-- Run this in your Supabase Dashboard -> SQL Editor (https://supabase.com/dashboard)
-- ============================================================================

-- 1. Drop the plaintext PIN column
ALTER TABLE shops DROP COLUMN IF EXISTS pin;

-- 2. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
