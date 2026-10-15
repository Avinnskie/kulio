begin;
create function public.collaboration_command(command jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  actor_id uuid := private.actor();
  operation text := command->>'type';
begin
  perform private.rate_limit('collaboration-write',90);
  perform pg_advisory_xact_lock(hashtextextended(actor_id::text,0));
  case operation
    when 'create_group','join_group','rotate_invite' then return private.room_command(command);
    when 'save_task','delete_task','update_assignment','remind' then return private.shared_task_command(command);
    when 'read_reminder' then
      update public.member_reminders set read_at = coalesce(read_at,now())
      where id = (command->>'reminderId')::uuid and to_id = actor_id;
      return jsonb_build_object('ok',true);
    else perform private.fail(400,'Perintah kolaborasi tidak dikenal.');
  end case;
  return null;
exception when check_violation or not_null_violation or invalid_text_representation or invalid_datetime_format or datetime_field_overflow then
  perform private.fail(400,'Data kolaborasi tidak valid. Periksa kembali isian.');
  return null;
end;
$$;
revoke all on function public.collaboration_command(jsonb) from public, anon;
grant execute on function public.collaboration_command(jsonb) to authenticated;
commit;
