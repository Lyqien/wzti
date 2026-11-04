create or replace function public.wzti_record(p_visitor_id uuid, p_kind text)
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
  select jsonb_build_object('opened',case when opened >= display_threshold then opened else null end)
    into result from public.wzti_totals where id = true;
  return result;
end;
$$;
revoke all on function public.wzti_record(uuid,text) from public, anon, authenticated;
grant execute on function public.wzti_record(uuid,text) to service_role;

create or replace function public.wzti_public_count()
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object('opened', case when opened >= display_threshold then opened else null end)
  from public.wzti_totals where id = true;
$$;
revoke all on function public.wzti_public_count() from public, anon, authenticated;
grant execute on function public.wzti_public_count() to service_role;
