-- Prepared migration. Apply only after inspecting the target project for name conflicts.
-- No LINE messages, credentials, or existing application tables are modified here.
begin;
create table public.mc_cloud_todos (
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  todo_key text not null check (todo_key ~ '^[a-f0-9]{64}$'),
  task text not null check (length(task) between 1 and 8000),
  subject text not null default '',
  source_type text not null check (source_type in ('LINE','Email')),
  assigned_to text not null default '',
  priority text not null default '待確認',
  analysis_date date,
  analysis_time time,
  analysis_note text not null default '',
  source_completed boolean not null default false,
  synced_at timestamptz not null default now(),
  primary key(owner_id,todo_key),
  check (analysis_date is not null or analysis_time is null)
);
create table public.mc_cloud_state (
  owner_id uuid not null default auth.uid(),
  todo_key text not null,
  completed boolean,
  completed_updated_at timestamptz,
  deadline_mode text not null default 'analysis' check (deadline_mode in ('analysis','manual')),
  manual_date date,
  manual_time time,
  deadline_updated_at timestamptz,
  primary key(owner_id,todo_key),
  foreign key(owner_id,todo_key) references public.mc_cloud_todos(owner_id,todo_key) on delete cascade,
  check (manual_date is not null or manual_time is null),
  check (deadline_mode='manual' or (manual_date is null and manual_time is null)),
  check ((completed is null) = (completed_updated_at is null))
);
alter table public.mc_cloud_todos enable row level security;
alter table public.mc_cloud_state enable row level security;
revoke all on public.mc_cloud_todos,public.mc_cloud_state from anon;
revoke all on public.mc_cloud_todos,public.mc_cloud_state from authenticated;
grant select,insert,update on public.mc_cloud_todos,public.mc_cloud_state to authenticated;
create policy mc_todos_own on public.mc_cloud_todos for all to authenticated
  using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
create policy mc_state_own on public.mc_cloud_state for all to authenticated
  using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);

create function public.mc_cloud_set_completed(p_key text,p_completed boolean)
returns void language plpgsql security invoker set search_path='' as $$
begin
  if auth.uid() is null or p_completed is null then
    raise exception 'Authentication and completion value required';
  end if;
  insert into public.mc_cloud_state(owner_id,todo_key,completed,completed_updated_at)
    values(auth.uid(),p_key,p_completed,clock_timestamp())
    on conflict(owner_id,todo_key) do update set
      completed=excluded.completed,completed_updated_at=excluded.completed_updated_at;
end;
$$;
create function public.mc_cloud_set_deadline(p_key text,p_mode text,p_date date default null,p_time time default null)
returns void language plpgsql security invoker set search_path='' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_mode is null or p_mode not in ('analysis','manual') then raise exception 'Invalid deadline mode'; end if;
  if p_mode='analysis' then p_date:=null; p_time:=null; end if;
  if p_date is null and p_time is not null then raise exception 'Date required before time'; end if;
  insert into public.mc_cloud_state(owner_id,todo_key,deadline_mode,manual_date,manual_time,deadline_updated_at)
    values(auth.uid(),p_key,p_mode,p_date,p_time,clock_timestamp())
    on conflict(owner_id,todo_key) do update set
      deadline_mode=excluded.deadline_mode,manual_date=excluded.manual_date,
      manual_time=excluded.manual_time,deadline_updated_at=excluded.deadline_updated_at;
end;
$$;
revoke all on function public.mc_cloud_set_completed(text,boolean) from public,anon;
revoke all on function public.mc_cloud_set_deadline(text,text,date,time) from public,anon;
grant execute on function public.mc_cloud_set_completed(text,boolean) to authenticated;
grant execute on function public.mc_cloud_set_deadline(text,text,date,time) to authenticated;
commit;
