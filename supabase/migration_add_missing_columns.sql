-- ============================================================================
-- SmartPrint: Database Migration - Add Missing Columns & Tables
-- Run this in your Supabase Dashboard -> SQL Editor (https://supabase.com/dashboard)
-- ============================================================================

-- 1. Ensure uuid-ossp extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Add missing columns to shops table safely
ALTER TABLE shops ADD COLUMN IF NOT EXISTS password_hash varchar(255);
ALTER TABLE shops DROP COLUMN IF EXISTS pin;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS phone varchar(32);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS pusher_app_id varchar(128);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS pusher_key varchar(128);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS pusher_secret varchar(128);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS pusher_cluster varchar(32) DEFAULT 'ap2';
ALTER TABLE shops ADD COLUMN IF NOT EXISTS enable_counter_pay boolean DEFAULT true;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS enable_upi_pay boolean DEFAULT true;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS enable_online_pay boolean DEFAULT true;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS payment_gateway_enabled boolean DEFAULT true;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS cashfree_app_id varchar(255);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS cashfree_secret_key varchar(255);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS cashfree_env varchar(32) DEFAULT 'sandbox';
ALTER TABLE shops ADD COLUMN IF NOT EXISTS default_language varchar(10) DEFAULT 'en';
ALTER TABLE shops ADD COLUMN IF NOT EXISTS plan_type varchar(32) DEFAULT 'trial';
ALTER TABLE shops ADD COLUMN IF NOT EXISTS subscription_status varchar(32) DEFAULT 'trialing';
ALTER TABLE shops ADD COLUMN IF NOT EXISTS trial_ends_at timestamp with time zone DEFAULT (now() + interval '15 days');

-- 3. Create shop_banners table if it does not exist
CREATE TABLE IF NOT EXISTS shop_banners (
    id varchar(64) PRIMARY KEY,
    shop_id uuid REFERENCES shops(id) ON DELETE CASCADE,
    title varchar(255) NOT NULL,
    subtitle text,
    badge varchar(50),
    badge_color varchar(20) DEFAULT 'marigold',
    bg_gradient text DEFAULT 'from-[#2C3A6B] via-[#212C52] to-[#16181D]',
    image_url text,
    link_url text,
    is_active boolean DEFAULT true,
    sort_order int DEFAULT 1,
    created_at timestamp with time zone DEFAULT now()
);

-- 4. Set up Row Level Security for shop_banners
ALTER TABLE shop_banners ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'shop_banners' AND policyname = 'Public can read active banners'
    ) THEN
        CREATE POLICY "Public can read active banners"
            ON shop_banners FOR SELECT
            USING (is_active = true);
    END IF;
END $$;

-- 5. Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
