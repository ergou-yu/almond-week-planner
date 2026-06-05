create extension if not exists "pgcrypto";

create type public.user_role as enum ('student', 'parent', 'teacher', 'institution');
create type public.task_status as enum ('pending', 'excellent', 'basic', 'stopped', 'postponed');
create type public.share_permission as enum ('status_review', 'full_edit', 'view_only');
create type public.evaluation_kind as enum ('self', 'parent', 'teacher', 'institution');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  role public.user_role not null default 'student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '我的周计划',
  big_goal text not null default '',
  start_date date not null,
  end_date date not null,
  role public.user_role not null default 'student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  title text not null,
  detail text not null default '',
  task_date date,
  status public.task_status not null default 'pending',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.collaborators (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  email text,
  role public.user_role not null default 'parent',
  created_at timestamptz not null default now(),
  unique(plan_id, user_id)
);

create table public.evaluations (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  kind public.evaluation_kind not null,
  content text not null default '',
  author_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(plan_id, kind)
);

create table public.share_links (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  permission public.share_permission not null default 'status_review',
  can_update_status boolean not null default true,
  can_update_evaluations boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

create trigger plans_updated_at before update on public.plans
for each row execute function public.set_updated_at();

create trigger tasks_updated_at before update on public.tasks
for each row execute function public.set_updated_at();

create trigger evaluations_updated_at before update on public.evaluations
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, role)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'username', ''),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    coalesce(nullif(new.raw_user_meta_data ->> 'role', '')::public.user_role, 'student')
  )
  on conflict (id) do update
  set
    username = excluded.username,
    display_name = excluded.display_name,
    role = excluded.role;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.plans enable row level security;
alter table public.tasks enable row level security;
alter table public.collaborators enable row level security;
alter table public.evaluations enable row level security;
alter table public.share_links enable row level security;

create policy "profiles are readable by owner" on public.profiles
for select using (auth.uid() = id);

create policy "profiles can update owner row" on public.profiles
for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "owners manage plans" on public.plans
for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "collaborators read plans" on public.plans
for select using (
  exists (
    select 1 from public.collaborators c
    where c.plan_id = plans.id and c.user_id = auth.uid()
  )
);

create policy "owners manage tasks" on public.tasks
for all using (
  exists (
    select 1 from public.plans p
    where p.id = tasks.plan_id and p.owner_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.plans p
    where p.id = tasks.plan_id and p.owner_id = auth.uid()
  )
);

create policy "collaborators read tasks" on public.tasks
for select using (
  exists (
    select 1 from public.collaborators c
    where c.plan_id = tasks.plan_id and c.user_id = auth.uid()
  )
);

create policy "owners manage collaborators" on public.collaborators
for all using (
  exists (
    select 1 from public.plans p
    where p.id = collaborators.plan_id and p.owner_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.plans p
    where p.id = collaborators.plan_id and p.owner_id = auth.uid()
  )
);

create policy "owners manage evaluations" on public.evaluations
for all using (
  exists (
    select 1 from public.plans p
    where p.id = evaluations.plan_id and p.owner_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.plans p
    where p.id = evaluations.plan_id and p.owner_id = auth.uid()
  )
);

create policy "collaborators read evaluations" on public.evaluations
for select using (
  exists (
    select 1 from public.collaborators c
    where c.plan_id = evaluations.plan_id and c.user_id = auth.uid()
  )
);

create policy "owners manage share links" on public.share_links
for all using (
  exists (
    select 1 from public.plans p
    where p.id = share_links.plan_id and p.owner_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.plans p
    where p.id = share_links.plan_id and p.owner_id = auth.uid()
  )
);
