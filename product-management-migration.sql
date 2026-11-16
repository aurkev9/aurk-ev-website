-- Run once in Supabase SQL Editor AFTER your existing setup.
create table if not exists public.site_products (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 category text not null default 'premium' check (category in ('premium','commuter')),
 tag text,
 price_text text default 'Ask for price',
 description text,
 image_url text,
 specifications text,
 featured boolean not null default false,
 created_at timestamptz not null default now()
);
alter table public.site_products enable row level security;
drop policy if exists "Public can read products" on public.site_products;
create policy "Public can read products" on public.site_products for select using (true);
drop policy if exists "Authenticated admins manage products" on public.site_products;
create policy "Authenticated admins manage products" on public.site_products for all to authenticated using (true) with check (true);
