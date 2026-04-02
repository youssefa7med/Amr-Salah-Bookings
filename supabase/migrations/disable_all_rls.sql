-- Disable Row Level Security (RLS) on all tables
-- This migration removes all RLS policies as they are not being used

-- Disable RLS on all tables
ALTER TABLE IF EXISTS public.shops DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.barbers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.services DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.daily_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.service_variants DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.barber_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.queue_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on barbers table (example - repeat for other tables if needed)
DROP POLICY IF EXISTS "barbers_select_own_shop" ON public.barbers;
DROP POLICY IF EXISTS "barbers_insert_own_shop" ON public.barbers;
DROP POLICY IF EXISTS "barbers_update_own_shop" ON public.barbers;
DROP POLICY IF EXISTS "barbers_delete_own_shop" ON public.barbers;

-- Drop all policies on other tables
DROP POLICY IF EXISTS "shops_select_own" ON public.shops;
DROP POLICY IF EXISTS "shops_insert_own" ON public.shops;
DROP POLICY IF EXISTS "shops_update_own" ON public.shops;
DROP POLICY IF EXISTS "shops_delete_own" ON public.shops;

DROP POLICY IF EXISTS "services_select_own_shop" ON public.services;
DROP POLICY IF EXISTS "services_insert_own_shop" ON public.services;
DROP POLICY IF EXISTS "services_update_own_shop" ON public.services;
DROP POLICY IF EXISTS "services_delete_own_shop" ON public.services;

DROP POLICY IF EXISTS "clients_select_own_shop" ON public.clients;
DROP POLICY IF EXISTS "clients_insert_own_shop" ON public.clients;
DROP POLICY IF EXISTS "clients_update_own_shop" ON public.clients;
DROP POLICY IF EXISTS "clients_delete_own_shop" ON public.clients;

DROP POLICY IF EXISTS "bookings_select_own_shop" ON public.bookings;
DROP POLICY IF EXISTS "bookings_insert_own_shop" ON public.bookings;
DROP POLICY IF EXISTS "bookings_update_own_shop" ON public.bookings;
DROP POLICY IF EXISTS "bookings_delete_own_shop" ON public.bookings;

DROP POLICY IF EXISTS "transactions_select_own_shop" ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert_own_shop" ON public.transactions;
DROP POLICY IF EXISTS "transactions_update_own_shop" ON public.transactions;
DROP POLICY IF EXISTS "transactions_delete_own_shop" ON public.transactions;

DROP POLICY IF EXISTS "daily_logs_select_own_shop" ON public.daily_logs;
DROP POLICY IF EXISTS "daily_logs_insert_own_shop" ON public.daily_logs;
DROP POLICY IF EXISTS "daily_logs_update_own_shop" ON public.daily_logs;
DROP POLICY IF EXISTS "daily_logs_delete_own_shop" ON public.daily_logs;

DROP POLICY IF EXISTS "expenses_select_own_shop" ON public.expenses;
DROP POLICY IF EXISTS "expenses_insert_own_shop" ON public.expenses;
DROP POLICY IF EXISTS "expenses_update_own_shop" ON public.expenses;
DROP POLICY IF EXISTS "expenses_delete_own_shop" ON public.expenses;

DROP POLICY IF EXISTS "settings_select_own_shop" ON public.settings;
DROP POLICY IF EXISTS "settings_insert_own_shop" ON public.settings;
DROP POLICY IF EXISTS "settings_update_own_shop" ON public.settings;
DROP POLICY IF EXISTS "settings_delete_own_shop" ON public.settings;

-- Verify RLS is disabled
SELECT 
  tablename, 
  schemaname,
  (SELECT count(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as policy_count
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
