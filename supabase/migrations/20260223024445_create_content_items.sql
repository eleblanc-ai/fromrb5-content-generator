-- Content type enum
create type content_type as enum (
  'flyer_text',
  'image',
  'tea_writeup',
  'communication'
);

-- Main content items table
create table content_items (
  id          uuid primary key default gen_random_uuid(),
  type        content_type not null,
  prompt      text not null,
  text_output text,
  image_url   text,
  parent_id   uuid references content_items(id),
  created_at  timestamptz not null default now()
);

-- Row-level security (single-user app; anon key has full access)
alter table content_items enable row level security;

create policy "anon full access"
  on content_items
  for all
  to anon
  using (true)
  with check (true);

-- Storage bucket for generated images
insert into storage.buckets (id, name, public)
values ('content-images', 'content-images', true);

-- Allow anon to read objects
create policy "anon read"
  on storage.objects
  for select
  to anon
  using (bucket_id = 'content-images');

-- Allow anon to upload objects
create policy "anon upload"
  on storage.objects
  for insert
  to anon
  with check (bucket_id = 'content-images');
