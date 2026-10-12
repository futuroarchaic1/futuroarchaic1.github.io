create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Таблицы
-- ------------------------------------------------------------

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  frozen date not null,
  max_seen date not null,
  theme text not null default 'system' check (theme in ('system', 'light', 'dark')),
  accent text not null default 'blue',
  done_color text not null default 'green',
  haptics boolean not null default true,
  motion boolean not null default true,
  lang text not null default 'ru',
  smart boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.habits (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  emoji text not null,
  color text not null,
  days smallint[] not null default '{}',
  created_on date not null,
  once boolean not null default false,
  ended_at date,
  sort_index integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.day_overrides (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  habit_id uuid not null references public.habits (id) on delete cascade,
  kind text not null check (kind in ('add', 'skip')),
  primary key (user_id, day, habit_id, kind)
);

create table if not exists public.past_plans (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  habit_id uuid not null references public.habits (id) on delete cascade,
  primary key (user_id, day, habit_id)
);

create table if not exists public.completions (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  habit_id uuid not null references public.habits (id) on delete cascade,
  primary key (user_id, day, habit_id)
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null default '',
  birthdate date,
  gender text not null default 'unspecified'
    check (gender in ('male', 'female', 'other', 'unspecified')),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Индексы
-- ------------------------------------------------------------

create index if not exists habits_user_idx on public.habits (user_id);
create index if not exists habits_user_active_idx on public.habits (user_id, ended_at);
create index if not exists day_overrides_user_day_idx on public.day_overrides (user_id, day);
create index if not exists past_plans_user_day_idx on public.past_plans (user_id, day);
create index if not exists completions_user_day_idx on public.completions (user_id, day);

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------

alter table public.user_settings enable row level security;
alter table public.habits enable row level security;
alter table public.day_overrides enable row level security;
alter table public.past_plans enable row level security;
alter table public.completions enable row level security;
alter table public.profiles enable row level security;

-- user_settings
drop policy if exists "settings_select_own" on public.user_settings;
drop policy if exists "settings_insert_own" on public.user_settings;
drop policy if exists "settings_update_own" on public.user_settings;
drop policy if exists "settings_delete_own" on public.user_settings;
create policy "settings_select_own" on public.user_settings
  for select using (auth.uid() = user_id);
create policy "settings_insert_own" on public.user_settings
  for insert with check (auth.uid() = user_id);
create policy "settings_update_own" on public.user_settings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "settings_delete_own" on public.user_settings
  for delete using (auth.uid() = user_id);

-- habits
drop policy if exists "habits_select_own" on public.habits;
drop policy if exists "habits_insert_own" on public.habits;
drop policy if exists "habits_update_own" on public.habits;
drop policy if exists "habits_delete_own" on public.habits;
create policy "habits_select_own" on public.habits
  for select using (auth.uid() = user_id);
create policy "habits_insert_own" on public.habits
  for insert with check (auth.uid() = user_id);
create policy "habits_update_own" on public.habits
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "habits_delete_own" on public.habits
  for delete using (auth.uid() = user_id);

-- day_overrides
drop policy if exists "overrides_select_own" on public.day_overrides;
drop policy if exists "overrides_insert_own" on public.day_overrides;
drop policy if exists "overrides_update_own" on public.day_overrides;
drop policy if exists "overrides_delete_own" on public.day_overrides;
create policy "overrides_select_own" on public.day_overrides
  for select using (auth.uid() = user_id);
create policy "overrides_insert_own" on public.day_overrides
  for insert with check (auth.uid() = user_id);
create policy "overrides_update_own" on public.day_overrides
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "overrides_delete_own" on public.day_overrides
  for delete using (auth.uid() = user_id);

-- past_plans
drop policy if exists "past_select_own" on public.past_plans;
drop policy if exists "past_insert_own" on public.past_plans;
drop policy if exists "past_update_own" on public.past_plans;
drop policy if exists "past_delete_own" on public.past_plans;
create policy "past_select_own" on public.past_plans
  for select using (auth.uid() = user_id);
create policy "past_insert_own" on public.past_plans
  for insert with check (auth.uid() = user_id);
create policy "past_update_own" on public.past_plans
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "past_delete_own" on public.past_plans
  for delete using (auth.uid() = user_id);

-- completions
drop policy if exists "completions_select_own" on public.completions;
drop policy if exists "completions_insert_own" on public.completions;
drop policy if exists "completions_update_own" on public.completions;
drop policy if exists "completions_delete_own" on public.completions;
create policy "completions_select_own" on public.completions
  for select using (auth.uid() = user_id);
create policy "completions_insert_own" on public.completions
  for insert with check (auth.uid() = user_id);
create policy "completions_update_own" on public.completions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "completions_delete_own" on public.completions
  for delete using (auth.uid() = user_id);

-- profiles
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = user_id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = user_id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "profiles_delete_own" on public.profiles
  for delete using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- Права
-- ------------------------------------------------------------

revoke all on public.user_settings, public.habits, public.day_overrides,
  public.past_plans, public.completions, public.profiles
from anon, public;

grant select, insert, update, delete
  on public.user_settings, public.habits, public.day_overrides,
     public.past_plans, public.completions, public.profiles
  to authenticated;