-- Monthly planner (income + planned spending) and savings goals ("piggy banks").
-- Run once in the Supabase SQL Editor. Requires PostgreSQL 15+ (column list in ON DELETE SET NULL).
--
-- Security model: every row belongs to exactly one user. Row Level Security limits each
-- operation to the signed-in owner, and the composite foreign keys below make it impossible
-- to reference another user's savings goal even by guessing its id.

create table savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  target_amount numeric(12,2) check (target_amount is null or (target_amount > 0 and target_amount < 1000000000)),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create table savings_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  goal_id uuid not null,
  entry_date date not null default current_date,
  amount numeric(12,2) not null check (amount <> 0 and abs(amount) < 1000000000),
  note text check (note is null or char_length(note) <= 120),
  created_at timestamptz not null default now(),
  foreign key (goal_id, user_id) references savings_goals (id, user_id) on delete cascade
);

create table plan_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  plan_month date not null check (plan_month = date_trunc('month', plan_month)::date),
  kind text not null check (kind in ('income', 'allocation')),
  label text not null check (char_length(btrim(label)) between 1 and 60),
  amount numeric(12,2) not null check (amount > 0 and amount < 1000000000),
  category text check (category is null or char_length(category) <= 60),
  savings_goal_id uuid,
  created_at timestamptz not null default now(),
  check (kind = 'allocation' or (category is null and savings_goal_id is null)),
  check (category is null or savings_goal_id is null),
  foreign key (savings_goal_id, user_id) references savings_goals (id, user_id) on delete set null (savings_goal_id)
);

create index plan_items_user_month_idx on plan_items (user_id, plan_month);
create index savings_entries_user_goal_idx on savings_entries (user_id, goal_id, entry_date);

revoke all on savings_goals, savings_entries, plan_items from anon;

alter table savings_goals enable row level security;
alter table savings_entries enable row level security;
alter table plan_items enable row level security;

-- savings_goals
create policy "Users can view own savings goals"
  on savings_goals for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own savings goals"
  on savings_goals for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own savings goals"
  on savings_goals for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own savings goals"
  on savings_goals for delete to authenticated
  using ((select auth.uid()) = user_id);

-- savings_entries
create policy "Users can view own savings entries"
  on savings_entries for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own savings entries"
  on savings_entries for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own savings entries"
  on savings_entries for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own savings entries"
  on savings_entries for delete to authenticated
  using ((select auth.uid()) = user_id);

-- plan_items
create policy "Users can view own plan items"
  on plan_items for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own plan items"
  on plan_items for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own plan items"
  on plan_items for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own plan items"
  on plan_items for delete to authenticated
  using ((select auth.uid()) = user_id);
