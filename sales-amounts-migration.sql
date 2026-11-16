-- AUR-K EV: numeric order amounts for invoices and sales analytics.
-- Run once in the EXISTING Supabase SQL Editor. Safe for existing orders.
alter table public.site_orders
  add column if not exists subtotal_amount numeric(12,2),
  add column if not exists delivery_charge numeric(12,2),
  add column if not exists final_amount numeric(12,2);

comment on column public.site_orders.subtotal_amount is 'Numeric sum of order item line totals in PKR';
comment on column public.site_orders.delivery_charge is 'Delivery charge entered by AUR-K EV admin in PKR';
comment on column public.site_orders.final_amount is 'Subtotal plus delivery charge in PKR';
