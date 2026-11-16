-- Run once in Supabase SQL Editor AFTER your existing setup.
-- Adds news posts and site updates for the admin panel. Does not touch site_images or site_products.
create table if not exists public.site_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind text not null default 'post' check (kind in ('post','update')),
  body text,
  image_url text,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.site_posts enable row level security;

-- Visitors only see published posts; drafts stay private to signed-in admins.
drop policy if exists "Public can read published posts" on public.site_posts;
create policy "Public can read published posts" on public.site_posts
  for select using (published = true);

drop policy if exists "Authenticated admins manage posts" on public.site_posts;
create policy "Authenticated admins manage posts" on public.site_posts
  for all to authenticated using (true) with check (true);

create index if not exists site_posts_created_at_idx on public.site_posts (created_at desc);
