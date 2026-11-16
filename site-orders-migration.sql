-- AUR-K EV customer orders. Run once in the EXISTING Supabase SQL Editor.
-- Creates only a new table and policies; does not modify products, images, buckets or users.
create table if not exists public.site_orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null check (char_length(customer_name) between 1 and 100),
  customer_phone text not null check (char_length(customer_phone) between 5 and 25),
  delivery_address text not null check (char_length(delivery_address) between 1 and 500),
  city text not null check (char_length(city) between 1 and 80),
  customer_note text,
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) > 0),
  payment_method text not null default 'Cash on Delivery' check (payment_method = 'Cash on Delivery'),
  status text not null default 'New' check (status in ('New','Confirmed','Processing','Dispatched','Delivered','Cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.site_orders enable row level security;
drop policy if exists "Public can submit orders" on public.site_orders;
create policy "Public can submit orders" on public.site_orders for insert to anon, authenticated with check (status = 'New' and payment_method = 'Cash on Delivery');
drop policy if exists "Authenticated admins can read orders" on public.site_orders;
create policy "Authenticated admins can read orders" on public.site_orders for select to authenticated using (true);
drop policy if exists "Authenticated admins can update orders" on public.site_orders;
create policy "Authenticated admins can update orders" on public.site_orders for update to authenticated using (true) with check (status in ('New','Confirmed','Processing','Dispatched','Delivered','Cancelled'));
grant insert on public.site_orders to anon, authenticated;
grant select, update on public.site_orders to authenticated;
