create table if not exists public.schedule_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id text null,
  title text null,
  scheduled_at timestamptz not null,
  study_type text null,
  created_at timestamptz not null default now()
);

alter table public.schedule_items enable row level security;

drop policy if exists "Users can read own schedule items" on public.schedule_items;
create policy "Users can read own schedule items"
on public.schedule_items
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own schedule items" on public.schedule_items;
create policy "Users can insert own schedule items"
on public.schedule_items
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own schedule items" on public.schedule_items;
create policy "Users can update own schedule items"
on public.schedule_items
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own schedule items" on public.schedule_items;
create policy "Users can delete own schedule items"
on public.schedule_items
for delete
to authenticated
using (auth.uid() = user_id);
