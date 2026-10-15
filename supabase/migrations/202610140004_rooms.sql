begin;
create function private.invite_code() returns text
language sql volatile set search_path = '' as $$
  select upper(substr(gen_random_uuid()::text,1,8) || substr(gen_random_uuid()::text,1,8));
$$;
create function private.room_command(command jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  actor_id uuid := private.actor();
  operation text := command->>'type';
  target_room uuid;
  invitation text;
  expiry timestamptz;
begin
  if operation = 'create_group' then
    if (select count(*) from public.room_members where user_id = actor_id) >= 20 then
      perform private.fail(400,'Maksimal 20 ruang per akun.');
    end if;
    insert into public.rooms(title,owner_id) values (btrim(command->>'title'),actor_id) returning id into target_room;
    insert into public.room_members(room_id,user_id,role) values (target_room,actor_id,'owner');
    insert into public.room_invites(room_id,code) values (target_room,private.invite_code());
    return jsonb_build_object('ok',true,'groupId',target_room);
  elsif operation = 'join_group' then
    perform private.rate_limit('join',10);
    invitation := upper(regexp_replace(command->>'code','[-\s]','','g'));
    select room_id,expires_at into target_room,expiry from public.room_invites where code = invitation for update;
    if target_room is null or expiry <= now() then perform private.fail(404,'Kode tidak ditemukan atau sudah kedaluwarsa.'); end if;
    perform 1 from public.rooms where id = target_room for update;
    if exists(select 1 from public.room_members where room_id = target_room and user_id = actor_id) then
      return jsonb_build_object('ok',true,'groupId',target_room);
    end if;
    if (select count(*) from public.room_members where user_id = actor_id) >= 20 then
      perform private.fail(400,'Maksimal 20 ruang per akun.');
    end if;
    if (select count(*) from public.room_members where room_id = target_room) >= 100 then
      perform private.fail(400,'Ruang sudah mencapai batas 100 anggota.');
    end if;
    insert into public.room_members(room_id,user_id,role) values (target_room,actor_id,'member');
    insert into public.task_assignments(task_id,room_id,member_id,updated_by)
    select id,room_id,actor_id,actor_id from public.shared_tasks where room_id = target_room and all_members;
    return jsonb_build_object('ok',true,'groupId',target_room);
  elsif operation = 'rotate_invite' then
    target_room := (command->>'groupId')::uuid;
    if private.require_member(target_room) <> 'owner' then perform private.fail(403,'Hanya pemilik ruang yang dapat mengganti kode.'); end if;
    update public.room_invites set code = private.invite_code(), expires_at = now() + interval '7 days' where room_id = target_room;
    return jsonb_build_object('ok',true);
  end if;
  perform private.fail(400,'Perintah ruang tidak dikenal.');
  return null;
end;
$$;
revoke all on function private.invite_code(), private.room_command(jsonb) from public, anon, authenticated;
commit;
