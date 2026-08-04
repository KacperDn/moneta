create table budgets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  monthly_goal numeric not null,
  updated_at timestamptz not null default now()
);

alter table budgets enable row level security;

create policy "Users can view own budget"
  on budgets for select
  using (auth.uid() = user_id);

create policy "Users can insert own budget"
  on budgets for insert
  with check (auth.uid() = user_id);

create policy "Users can update own budget"
  on budgets for update
  using (auth.uid() = user_id);

create policy "Users can delete own budget"
  on budgets for delete
  using (auth.uid() = user_id);
