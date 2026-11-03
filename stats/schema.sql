-- The dashboard is private to project members; browser roles have no table access.
create table public.wzti_events (
  visitor_id uuid not null,
  kind text not null check (kind in ('opened','completed')),
  created_at timestamptz not null default now(),
  primary key (visitor_id, kind)
);
create index wzti_events_created_at on public.wzti_events(created_at);
alter table public.wzti_events enable row level security;
revoke all on public.wzti_events from public, anon, authenticated;
grant select, insert on public.wzti_events to service_role;

create table public.wzti_totals (
  id boolean primary key default true check(id),
  opened bigint not null default 0,
  completed bigint not null default 0,
  display_threshold bigint not null default 5000 check(display_threshold > 0)
);
alter table public.wzti_totals enable row level security;
revoke all on public.wzti_totals from public, anon, authenticated;
grant select, update on public.wzti_totals to service_role;
insert into public.wzti_totals(id) values(true);

-- Invoker rights: only service_role (in the Edge Function) can read or write.
create function public.wzti_record(p_visitor_id uuid, p_kind text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare new_open integer; new_complete integer := 0; result jsonb;
begin
  if p_kind not in ('opened', 'completed') or p_kind is null or p_visitor_id is null then
    raise exception 'invalid event';
  end if;
  insert into public.wzti_events(visitor_id,kind) values(p_visitor_id,'opened')
    on conflict do nothing;
  get diagnostics new_open = row_count;
  if p_kind = 'completed' then
    insert into public.wzti_events(visitor_id,kind) values(p_visitor_id,'completed')
      on conflict do nothing;
    get diagnostics new_complete = row_count;
  end if;
  update public.wzti_totals set opened = opened + new_open, completed = completed + new_complete
    where id = true;
  select jsonb_build_object('completed',case when completed >= display_threshold then completed else null end)
    into result from public.wzti_totals where id = true;
  return result;
end;
$$;
revoke all on function public.wzti_record(uuid,text) from public, anon, authenticated;
grant execute on function public.wzti_record(uuid,text) to service_role;

create function public.wzti_public_count()
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object('completed', case when completed >= display_threshold then completed else null end)
  from public.wzti_totals where id = true;
$$;
revoke all on function public.wzti_public_count() from public, anon, authenticated;
grant execute on function public.wzti_public_count() to service_role;
