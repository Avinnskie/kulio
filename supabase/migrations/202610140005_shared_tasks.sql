begin;
create function private.shared_task_command(command jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  actor_id uuid := private.actor();
  target_room uuid := (command->>'groupId')::uuid;
  operation text := command->>'type';
  membership_role text := private.require_member(target_room);
  target_task uuid := (command->>'taskId')::uuid;
  target_member uuid := (command->>'memberId')::uuid;
  task_creator uuid;
  targets uuid[];
  status_value text;
  changed integer;
  room_wide boolean;
begin
  perform 1 from public.rooms where id = target_room for update;
  if target_task is not null then
    select created_by into task_creator from public.shared_tasks where id = target_task and room_id = target_room;
    if task_creator is null then perform private.fail(404,'Tugas tidak ditemukan.'); end if;
  end if;
  if operation = 'save_task' then
    if target_task is not null and task_creator <> actor_id and membership_role <> 'owner' then
      perform private.fail(403,'Hanya pembuat tugas atau pemilik ruang yang dapat mengeditnya.');
    end if;
    room_wide := (command->>'allMembers')::boolean;
    if room_wide then
      select array_agg(user_id) into targets from public.room_members where room_id = target_room;
    else
      if jsonb_typeof(command->'memberIds') is distinct from 'array' or jsonb_array_length(command->'memberIds') > 100 then
        perform private.fail(400,'Pilih anggota dari ruang ini.');
      end if;
      select array_agg(distinct value::uuid) into targets from jsonb_array_elements_text(command->'memberIds');
    end if;
    if coalesce(array_length(targets,1),0) = 0 or exists(
      select 1 from unnest(targets) selected(id) where not exists(
        select 1 from public.room_members where room_id = target_room and user_id = selected.id)
    ) then perform private.fail(400,'Pilih minimal satu anggota dari ruang ini.'); end if;
    if target_task is null then
      insert into public.shared_tasks(room_id,title,course_id,due_at,notes,priority,created_by,all_members)
      values (target_room,btrim(command->>'title'),command->>'courseId',(command->>'dueAt')::timestamptz,
        btrim(command->>'notes'),command->>'priority',actor_id,room_wide) returning id into target_task;
    else
      update public.shared_tasks set title = btrim(command->>'title'),course_id = command->>'courseId',
        due_at = (command->>'dueAt')::timestamptz,notes = btrim(command->>'notes'),priority = command->>'priority',all_members = room_wide
      where id = target_task;
      delete from public.task_assignments where task_id = target_task and not (member_id = any(targets));
    end if;
    insert into public.task_assignments(task_id,room_id,member_id,updated_by)
    select target_task,target_room,id,actor_id from unnest(targets) selected(id) on conflict (task_id,member_id) do nothing;
  elsif operation = 'delete_task' then
    if target_task is null then perform private.fail(400,'Pilih tugas yang akan dihapus.'); end if;
    if task_creator <> actor_id and membership_role <> 'owner' then
      perform private.fail(403,'Hanya pembuat tugas atau pemilik ruang yang dapat menghapusnya.');
    end if;
    delete from public.shared_tasks where id = target_task and room_id = target_room;
  elsif operation = 'update_assignment' then
    status_value := command->>'status';
    if status_value is null or status_value not in ('belum_selesai','dikerjakan','selesai') then
      perform private.fail(400,'Status tugas tidak valid.');
    end if;
    update public.task_assignments set status = status_value,
      progress = case status_value when 'selesai' then 100 when 'belum_selesai' then 0
        else case when progress > 0 and progress < 100 then progress else 50 end end,
      version = version + 1,updated_at = now(),updated_by = actor_id
    where task_id = target_task and room_id = target_room and member_id = target_member and version = (command->>'expectedVersion')::integer;
    get diagnostics changed = row_count;
    if changed = 0 then perform private.fail(409,'Status berubah oleh anggota lain. Data diperbarui; silakan pilih kembali.'); end if;
  elsif operation = 'remind' then
    if target_member = actor_id then perform private.fail(400,'Pilih anggota lain untuk diingatkan.'); end if;
    select status into status_value from public.task_assignments where task_id = target_task and room_id = target_room and member_id = target_member;
    if status_value is null then perform private.fail(404,'Penugasan anggota tidak ditemukan.'); end if;
    if status_value = 'selesai' then perform private.fail(400,'Tugas anggota ini sudah selesai.'); end if;
    if exists(select 1 from public.member_reminders where from_id = actor_id and to_id = target_member
      and task_id = target_task and created_at > now() - interval '1 minute') then
      perform private.fail(429,'Pengingat sudah dikirim. Tunggu satu menit.');
    end if;
    insert into public.member_reminders(room_id,task_id,from_id,to_id,message)
    values (target_room,target_task,actor_id,target_member,btrim(command->>'message'));
  else
    perform private.fail(400,'Perintah tugas bersama tidak dikenal.');
  end if;
  return jsonb_build_object('ok',true);
end;
$$;
revoke all on function private.shared_task_command(jsonb) from public, anon, authenticated;
commit;
