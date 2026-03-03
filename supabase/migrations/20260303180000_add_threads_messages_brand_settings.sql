-- threads: one row per flyer brief (replaces flat history)
create table threads (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  format      text not null,
  render_mode text not null,
  created_at  timestamptz not null default now()
);

alter table threads enable row level security;

create policy "anon full access"
  on threads
  for all
  to anon
  using (true)
  with check (true);

-- messages: chat turns within a thread; links to generated flyer items
create table messages (
  id            uuid primary key default gen_random_uuid(),
  thread_id     uuid not null references threads(id) on delete cascade,
  role          text not null check (role in ('user', 'assistant')),
  content       text not null default '',
  flyer_item_id uuid references content_items(id),
  created_at    timestamptz not null default now()
);

alter table messages enable row level security;

create policy "anon full access"
  on messages
  for all
  to anon
  using (true)
  with check (true);

-- brand_settings: singleton row with brand identity settings
create table brand_settings (
  id               uuid primary key default gen_random_uuid(),
  brand_name       text not null default '',
  brand_tagline    text not null default '',
  color_palette    text[] not null default '{}',
  font_preference  text not null default '',
  logo_url         text,
  created_at       timestamptz not null default now()
);

alter table brand_settings enable row level security;

create policy "anon full access"
  on brand_settings
  for all
  to anon
  using (true)
  with check (true);
