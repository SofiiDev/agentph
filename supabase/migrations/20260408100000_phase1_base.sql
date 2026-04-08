create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null,
  full_name text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "user can read own profile"
on profiles
for select
using (auth.uid() = id);
