-- Allows users to edit their own expenses. Safe to re-run.
alter table expenses enable row level security;

drop policy if exists "Users can update own expenses" on expenses;

create policy "Users can update own expenses"
  on expenses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
