begin;
create function private.fail(status integer, message text) returns void
language plpgsql set search_path = '' as $$
begin
  raise exception using errcode = 'P0001', message = jsonb_build_object('status',status,'error',message)::text;
end;
$$;
create function private.actor() returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare actor_id uuid := auth.uid();
begin
  if actor_id is null then perform private.fail(401,'Masuk ke akun untuk mengakses data Anda.'); end if;
  if not exists(select 1 from public.profiles where id = actor_id) then
    perform private.fail(403,'Profil akun belum tersedia.');
  end if;
  return actor_id;
end;
$$;
create function private.require_member(target_room uuid) returns text
language plpgsql stable security definer set search_path = '' as $$
declare membership_role text;
begin
  select role into membership_role from public.room_members where room_id = target_room and user_id = private.actor();
  if membership_role is null then perform private.fail(403,'Anda belum bergabung ke ruang ini.'); end if;
  return membership_role;
end;
$$;
create function private.rate_limit(action_name text, budget integer) returns void
language plpgsql security definer set search_path = '' as $$
declare used integer;
begin
  insert into private.request_limits(user_id,action) values (private.actor(),action_name)
  on conflict (user_id,action) do update set
    count = case when private.request_limits.started_at < now() - interval '1 minute' then 1 else private.request_limits.count + 1 end,
    started_at = case when private.request_limits.started_at < now() - interval '1 minute' then now() else private.request_limits.started_at end
  returning count into used;
  if used > budget then perform private.fail(429,'Terlalu banyak permintaan. Tunggu satu menit.'); end if;
end;
$$;
create function private.iso(value timestamptz) returns text
language sql immutable strict set search_path = '' as $$
  select to_char(value at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
$$;
create function private.personal_snapshot() returns jsonb
language sql volatile security definer set search_path = '' as $$
  select jsonb_build_object('tasks',coalesce(jsonb_agg(jsonb_build_object(
    'id',id,'title',title,'courseId',course_id,'dueAt',private.iso(due_at),'status',status,
    'priority',priority,'progress',progress,'notes',notes,'createdAt',private.iso(created_at)
  ) order by due_at),'[]'::jsonb), 'versions',coalesce(jsonb_object_agg(id::text,revision),'{}'::jsonb))
  from public.personal_tasks where user_id = private.actor();
$$;
revoke all on function private.fail(integer,text), private.actor(), private.require_member(uuid),
  private.rate_limit(text,integer), private.iso(timestamptz), private.personal_snapshot() from public, anon, authenticated;
commit;
