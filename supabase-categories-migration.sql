create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text not null,
  color text not null,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table categories enable row level security;

create policy "Users can view own categories"
  on categories for select
  using (auth.uid() = user_id);

create policy "Users can insert own categories"
  on categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update own categories"
  on categories for update
  using (auth.uid() = user_id);

create policy "Users can delete own categories"
  on categories for delete
  using (auth.uid() = user_id);
