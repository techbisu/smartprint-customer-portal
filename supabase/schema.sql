-- SmartPrint: Supabase schema for the customer portal + desktop agent.
-- Run this once in your Supabase project's SQL Editor.

create extension if not exists "uuid-ossp";

-- 1. Shops -----------------------------------------------------------------
create table if not exists shops (
    id uuid primary key default uuid_generate_v4(),
    slug varchar(255) unique not null,
    shop_name varchar(255) not null,
    upi_vpa varchar(255) not null,
    is_online boolean default true,
    -- Long random token the desktop agent authenticates with. Generate one
    -- per shop during onboarding, e.g. `openssl rand -hex 32`, and paste it
    -- into that shop's agent Settings tab as "Auth Token".
    agent_auth_token varchar(128) unique not null,
    password_hash varchar(255),
    phone varchar(32),
    address text,
    pusher_app_id varchar(128),
    pusher_key varchar(128),
    pusher_secret varchar(128),
    pusher_cluster varchar(32) default 'ap2',
    enable_counter_pay boolean default true,
    enable_upi_pay boolean default true,
    enable_online_pay boolean default true,
    payment_gateway_enabled boolean default true,
    cashfree_app_id varchar(255),
    cashfree_secret_key varchar(255),
    cashfree_env varchar(32) default 'sandbox',
    default_language varchar(10) default 'en',
    plan_type varchar(32) default 'trial',
    subscription_status varchar(32) default 'trialing',
    trial_ends_at timestamp with time zone default (now() + interval '15 days'),
    created_at timestamp with time zone default now()
);

-- 2. Rate card (dynamic services menu) --------------------------------------
create table if not exists shop_rate_card (
    id uuid primary key default uuid_generate_v4(),
    shop_id uuid references shops(id) on delete cascade,
    category varchar(50) not null,          -- 'Standard Print', 'ID Card', 'Legal Document'
    service_code varchar(50) not null,      -- 'standard_print', 'smart_id_a4', 'rent_agreement'
    display_name varchar(255) not null,
    pricing_model varchar(20) not null,     -- 'per_page', 'flat_fee', 'per_copy'
    price_bw decimal(10, 2) not null,
    price_color decimal(10, 2),             -- null = this service has no color option
    supports_duplex boolean default false,
    is_active boolean default true,
    unique(shop_id, service_code)
);

-- 3. Print jobs ---------------------------------------------------------------
create table if not exists print_jobs (
    id uuid primary key default uuid_generate_v4(),
    shop_id uuid references shops(id),
    service_code varchar(50) not null,
    file_url text not null,
    file_type varchar(10) not null,
    pages int default 1,
    page_selection varchar(255) default 'all',
    copies int default 1,
    is_color boolean default false,
    is_duplex boolean default false,
    total_amount decimal(10, 2) not null,
    payment_status varchar(20) default 'PENDING', -- PENDING_UPI, PENDING_COUNTER, PAID
    print_status varchar(20) default 'QUEUED',      -- QUEUED, DOWNLOADING, PRINTING, COMPLETED, FAILED
    created_at timestamp with time zone default now()
);

-- 4. Shop banners -------------------------------------------------------------
create table if not exists shop_banners (
    id varchar(64) primary key,
    shop_id uuid references shops(id) on delete cascade,
    title varchar(255) not null,
    subtitle text,
    badge varchar(50),
    badge_color varchar(20) default 'marigold',
    bg_gradient text default 'from-[#2C3A6B] via-[#212C52] to-[#16181D]',
    image_url text,
    link_url text,
    is_active boolean default true,
    sort_order int default 1,
    created_at timestamp with time zone default now()
);

-- Row Level Security ----------------------------------------------------------
-- The customer portal's browser code uses the ANON key for two things only:
-- reading active rate-card rows, and uploading files to Storage. Everything
-- else (reading shop-by-token, inserting jobs, triggering Pusher) happens
-- server-side in the Next.js API routes using the SERVICE ROLE key, which
-- bypasses RLS entirely — so these policies only need to cover the
-- anon-key paths.

alter table shops enable row level security;
alter table shop_rate_card enable row level security;
alter table print_jobs enable row level security;
alter table shop_banners enable row level security;

-- Anyone can read active banners
create policy "Public can read active banners"
    on shop_banners for select
    using (is_active = true);

-- Anyone can read basic shop info (needed to render the page header).
create policy "Public can read shops"
    on shops for select
    using (true);

-- Anyone can read a shop's ACTIVE rate card rows (needed to show services
-- and prices before the customer has authenticated in any way).
create policy "Public can read active rate cards"
    on shop_rate_card for select
    using (is_active = true);

-- No public policies on print_jobs at all — every read/write to that
-- table goes through the service-role API routes, which enforce their own
-- checks (shop lookup, is_online, token match).

-- Storage bucket ---------------------------------------------------------------
-- Create a PUBLIC bucket for customer uploads. Public means "anyone with
-- the exact random URL can read it" — acceptable here because paths are
-- unguessable UUIDs and the desktop agent shreds the local copy after
-- printing; it does not mean the bucket is browsable/listable.
insert into storage.buckets (id, name, public, file_size_limit)
values ('print-uploads', 'print-uploads', true, 41943040) -- 40MB
on conflict (id) do nothing;

-- Allow anyone (anon key) to upload into this bucket. Anyone can also
-- read given the exact path, which is required for the public URL scheme
-- used by the portal and for the desktop agent's plain HTTP download.
create policy "Public can upload prints"
    on storage.objects for insert
    with check (bucket_id = 'print-uploads');

create policy "Public can read prints"
    on storage.objects for select
    using (bucket_id = 'print-uploads');

-- Storage cleanup trigger ------------------------------------------------------
-- When a print job's status changes to 'COMPLETED', delete the corresponding
-- uploaded file from the storage bucket to free up space.

-- Clean up old trigger/function if it exists
drop trigger if exists trigger_delete_print_job_file on print_jobs;
drop function if exists delete_storage_object();

create or replace function delete_storage_object_on_complete()
returns trigger as $$
declare
    file_path text;
begin
    if NEW.print_status = 'COMPLETED' and OLD.print_status is distinct from 'COMPLETED' then
        -- Extract the object path from the public URL (everything after 'print-uploads/')
        file_path := split_part(NEW.file_url, 'print-uploads/', 2);

        if file_path is not null and file_path != '' then
            delete from storage.objects
            where bucket_id = 'print-uploads' and name = file_path;
        end if;
    end if;

    return NEW;
end;
$$ language plpgsql security definer;

-- Drop the trigger if it exists to allow re-running this script easily
drop trigger if exists trigger_delete_print_job_file_on_complete on print_jobs;

create trigger trigger_delete_print_job_file_on_complete
after update of print_status on print_jobs
for each row
execute function delete_storage_object_on_complete();

-- Example seed data for local testing — replace with your real shop.
-- insert into shops (slug, shop_name, upi_vpa, agent_auth_token)
-- values ('demo-shop', 'Demo Print & Xerox', 'demoshop@upi', 'replace-with-a-long-random-token');
--
-- insert into shop_rate_card (shop_id, category, service_code, display_name, pricing_model, price_bw, price_color, supports_duplex)
-- select id, 'Standard Print', 'standard_print', 'Document Print', 'per_page', 2.00, 8.00, true
-- from shops where slug = 'demo-shop';
