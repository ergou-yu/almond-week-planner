do $$
begin
  if not exists (select 1 from pg_type where typname = 'task_priority') then
    create type public.task_priority as enum ('low', 'medium', 'high', 'urgent');
  end if;
end
$$;

alter table public.tasks
add column if not exists priority public.task_priority not null default 'medium';
