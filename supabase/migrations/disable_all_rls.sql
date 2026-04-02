-- Disable Row Level Security (RLS) on all tables
-- This migration removes all RLS policies from existing tables

-- Disable RLS on barbers table (the one causing the issue)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'barbers' AND table_schema = 'public') THEN
    ALTER TABLE public.barbers DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop all policies on barbers table
DO $$ 
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "barbers_select_own_shop" ON public.barbers';
  EXECUTE 'DROP POLICY IF EXISTS "barbers_insert_own_shop" ON public.barbers';
  EXECUTE 'DROP POLICY IF EXISTS "barbers_update_own_shop" ON public.barbers';
  EXECUTE 'DROP POLICY IF EXISTS "barbers_delete_own_shop" ON public.barbers';
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

-- Disable RLS on other tables if they exist
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shops' AND table_schema = 'public') THEN
    ALTER TABLE public.shops DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'services' AND table_schema = 'public') THEN
    ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients' AND table_schema = 'public') THEN
    ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings' AND table_schema = 'public') THEN
    ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions' AND table_schema = 'public') THEN
    ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_logs' AND table_schema = 'public') THEN
    ALTER TABLE public.daily_logs DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expenses' AND table_schema = 'public') THEN
    ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'settings' AND table_schema = 'public') THEN
    ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;
