begin;
create function public.personal_snapshot() returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform private.actor();
  return private.personal_snapshot();
end;
$$;
create function public.personal_command(command jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  actor_id uuid := private.actor();
  operation text := command->>'type';
  task jsonb;
  task_id uuid;
  expected integer;
  changed integer;
begin
  perform private.rate_limit('personal-write',180);
  perform pg_advisory_xact_lock(hashtextextended(actor_id::text,0));
  if operation = 'import' then
    if jsonb_typeof(command->'tasks') is distinct from 'array' or jsonb_array_length(command->'tasks') > 500 then
      perform private.fail(400,'Maksimal 500 tugas dapat diimpor sekaligus.');
    end if;
    for task in select value from jsonb_array_elements(command->'tasks') loop
      insert into public.personal_tasks(id,user_id,title,course_id,due_at,status,priority,progress,notes,created_at)
      values ((task->>'id')::uuid,actor_id,task->>'title',task->>'courseId',(task->>'dueAt')::timestamptz,
        task->>'status',task->>'priority',(task->>'progress')::integer,task->>'notes',(task->>'createdAt')::timestamptz)
      on conflict (id) do nothing;
    end loop;
  elsif operation = 'save' then
    task := command->'task';
    task_id := (task->>'id')::uuid;
    expected := (command->>'expectedVersion')::integer;
    if expected is null then
      insert into public.personal_tasks(id,user_id,title,course_id,due_at,status,priority,progress,notes,created_at)
      values (task_id,actor_id,task->>'title',task->>'courseId',(task->>'dueAt')::timestamptz,
        task->>'status',task->>'priority',(task->>'progress')::integer,task->>'notes',(task->>'createdAt')::timestamptz)
      on conflict (id) do nothing;
      get diagnostics changed = row_count;
    else
      update public.personal_tasks set title = task->>'title',course_id = task->>'courseId',
        due_at = (task->>'dueAt')::timestamptz,status = task->>'status',priority = task->>'priority',
        progress = (task->>'progress')::integer,notes = task->>'notes',revision = nextval('private.personal_revision_seq')
      where id = task_id and user_id = actor_id and revision = expected;
      get diagnostics changed = row_count;
    end if;
    if changed = 0 then perform private.fail(409,'Tugas berubah pada perangkat lain. Muat ulang data lalu coba kembali.'); end if;
  elsif operation = 'delete' then
    task_id := (command->>'taskId')::uuid;
    expected := (command->>'expectedVersion')::integer;
    delete from public.personal_tasks where id = task_id and user_id = actor_id and revision = expected;
    get diagnostics changed = row_count;
    if changed = 0 then perform private.fail(409,'Tugas berubah pada perangkat lain. Muat ulang data lalu coba kembali.'); end if;
  else
    perform private.fail(400,'Perintah tugas tidak dikenal.');
  end if;
  return private.personal_snapshot();
exception when check_violation or not_null_violation or invalid_text_representation or invalid_datetime_format or datetime_field_overflow then
  perform private.fail(400,'Data tugas tidak valid. Periksa judul, mata kuliah, status, progres, dan tanggal.');
  return null;
end;
$$;
revoke all on function public.personal_snapshot(), public.personal_command(jsonb) from public, anon;
grant execute on function public.personal_snapshot(), public.personal_command(jsonb) to authenticated;
commit;
