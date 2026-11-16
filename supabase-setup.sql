-- Run this in Supabase SQL Editor.
create table if not exists public.site_images (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slot text not null check (slot in ('hero','product','gallery')),
  product_name text,
  storage_path text not null,
  public_url text not null,
  created_at timestamptz not null default now()
);
alter table public.site_images enable row level security;
-- Anyone can read website images; only signed-in admins can add/change/delete.
create policy "Public can read site images" on public.site_images for select using (true);
create policy "Authenticated users can add site images" on public.site_images for insert to authenticated with check (true);
create policy "Authenticated users can delete site images" on public.site_images for delete to authenticated using (true);
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('website-images','website-images',true,8388608,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
create policy "Public can view website images" on storage.objects for select using (bucket_id='website-images');
create policy "Authenticated users can upload website images" on storage.objects for insert to authenticated with check (bucket_id='website-images');
create policy "Authenticated users can delete website images" on storage.objects for delete to authenticated using (bucket_id='website-images');