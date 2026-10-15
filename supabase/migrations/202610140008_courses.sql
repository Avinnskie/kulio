begin;

create table public.courses (
  user_id uuid not null references public.profiles(id) on delete cascade,
  id text not null check (char_length(id) between 1 and 80),
  name text not null check (char_length(btrim(name)) between 2 and 60),
  short_name text not null check (char_length(btrim(short_name)) between 2 and 8),
  color text not null check (color in ('sage','amber','rose','blue')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id,id)
);
create unique index courses_user_name on public.courses(user_id,lower(btrim(name)));

insert into public.courses(user_id,id,name,short_name,color)
select reference.user_id, reference.id,
  case reference.id
    when 'struktur-data' then 'Struktur Data'
    when 'basis-data' then 'Basis Data'
    when 'interaksi-manusia-komputer' then 'Interaksi Manusia dan Komputer'
    when 'pemrograman-web' then 'Pemrograman Web'
  end,
  case reference.id
    when 'struktur-data' then 'STD'
    when 'basis-data' then 'BD'
    when 'interaksi-manusia-komputer' then 'IMK'
    when 'pemrograman-web' then 'WEB'
  end,
  case reference.id
    when 'struktur-data' then 'sage'
    when 'basis-data' then 'amber'
    when 'interaksi-manusia-komputer' then 'rose'
    when 'pemrograman-web' then 'blue'
  end
from (
  select distinct user_id,course_id as id from public.personal_tasks
  union
  select distinct created_by as user_id,course_id as id from public.shared_tasks
) reference
on conflict (user_id,id) do nothing;

alter table public.personal_tasks drop constraint if exists personal_tasks_course_id_check;
alter table public.shared_tasks drop constraint if exists shared_tasks_course_id_check;
alter table public.personal_tasks add constraint personal_tasks_course
  foreign key (user_id,course_id) references public.courses(user_id,id) on update cascade on delete restrict;
alter table public.shared_tasks add constraint shared_tasks_course
  foreign key (created_by,course_id) references public.courses(user_id,id) on update cascade on delete restrict;

alter table public.courses enable row level security;
revoke all on public.courses from public, anon, authenticated;

create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare label text;
begin
  label := btrim(new.raw_user_meta_data->>'display_name');
  if label is null or char_length(label) not between 2 and 60 then label := 'Mahasiswa'; end if;
  insert into public.profiles(id,display_name) values (new.id,label);
  return new;
end;
$$;

create or replace function private.personal_snapshot() returns jsonb
language sql volatile security definer set search_path = '' as $$
  select jsonb_build_object(
    'tasks',coalesce((select jsonb_agg(jsonb_build_object(
      'id',task.id,'title',task.title,'courseId',task.course_id,'dueAt',private.iso(task.due_at),'status',task.status,
      'priority',task.priority,'progress',task.progress,'notes',task.notes,'createdAt',private.iso(task.created_at)
    ) order by task.due_at) from public.personal_tasks task where task.user_id = private.actor()),'[]'::jsonb),
    'versions',coalesce((select jsonb_object_agg(task.id::text,task.revision)
      from public.personal_tasks task where task.user_id = private.actor()),'{}'::jsonb),
    'courses',coalesce((select jsonb_agg(jsonb_build_object(
      'id',course.id,'name',course.name,'shortName',course.short_name,'color',course.color
    ) order by course.created_at,course.name) from public.courses course where course.user_id = private.actor()),'[]'::jsonb)
  );
$$;

create or replace function public.personal_command(command jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  actor_id uuid := private.actor();
  operation text := command->>'type';
  task jsonb;
  course jsonb;
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
      insert into public.courses(user_id,id,name,short_name,color)
      select actor_id,task->>'courseId',
        case task->>'courseId'
          when 'struktur-data' then 'Struktur Data' when 'basis-data' then 'Basis Data'
          when 'interaksi-manusia-komputer' then 'Interaksi Manusia dan Komputer' when 'pemrograman-web' then 'Pemrograman Web' end,
        case task->>'courseId'
          when 'struktur-data' then 'STD' when 'basis-data' then 'BD'
          when 'interaksi-manusia-komputer' then 'IMK' when 'pemrograman-web' then 'WEB' end,
        case task->>'courseId'
          when 'struktur-data' then 'sage' when 'basis-data' then 'amber'
          when 'interaksi-manusia-komputer' then 'rose' when 'pemrograman-web' then 'blue' end
      where task->>'courseId' in ('struktur-data','basis-data','interaksi-manusia-komputer','pemrograman-web')
      on conflict (user_id,id) do nothing;
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
  elsif operation = 'save_course' then
    course := command->'course';
    insert into public.courses(user_id,id,name,short_name,color)
    values (actor_id,course->>'id',btrim(course->>'name'),upper(btrim(course->>'shortName')),course->>'color')
    on conflict (user_id,id) do update set
      name = excluded.name,short_name = excluded.short_name,color = excluded.color,updated_at = now();
  elsif operation = 'delete_course' then
    if exists(select 1 from public.personal_tasks where user_id = actor_id and course_id = command->>'courseId')
      or exists(select 1 from public.shared_tasks where created_by = actor_id and course_id = command->>'courseId') then
      perform private.fail(409,'Mata kuliah masih digunakan oleh tugas. Pindahkan tugas ke mata kuliah lain terlebih dahulu.');
    end if;
    delete from public.courses where user_id = actor_id and id = command->>'courseId';
    get diagnostics changed = row_count;
    if changed = 0 then perform private.fail(404,'Mata kuliah tidak ditemukan.'); end if;
  else
    perform private.fail(400,'Perintah tugas tidak dikenal.');
  end if;
  return private.personal_snapshot();
exception
  when unique_violation then
    perform private.fail(409,'Nama mata kuliah sudah digunakan.');
    return null;
  when foreign_key_violation then
    perform private.fail(400,'Pilih mata kuliah yang masih tersedia.');
    return null;
  when check_violation or not_null_violation or invalid_text_representation or invalid_datetime_format or datetime_field_overflow then
    perform private.fail(400,'Data tidak valid. Periksa tugas atau mata kuliah yang diisi.');
    return null;
end;
$$;

create or replace function public.workspace_snapshot(selected_group uuid default null) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  actor_id uuid := private.actor();
  groups jsonb;
  inbox jsonb;
  members jsonb;
  tasks jsonb;
  detail jsonb := null;
begin
  if selected_group is not null then perform private.require_member(selected_group); end if;
  select coalesce(jsonb_agg(private.room_summary(r.id) order by r.created_at),'[]'::jsonb) into groups
  from public.rooms r join public.room_members m on m.room_id = r.id where m.user_id = actor_id;
  select coalesce(jsonb_agg(jsonb_build_object('id',n.id,'groupId',n.room_id,'groupTitle',r.title,
    'taskTitle',t.title,'fromName',p.display_name,'message',n.message,'createdAt',private.iso(n.created_at),
    'readAt',private.iso(n.read_at)) order by n.created_at desc),'[]'::jsonb) into inbox
  from (select * from public.member_reminders where to_id = actor_id order by created_at desc limit 100) n
  join public.rooms r on r.id = n.room_id join public.shared_tasks t on t.id = n.task_id
  join public.profiles p on p.id = n.from_id;
  if selected_group is not null then
    select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'displayName',p.display_name,'role',m.role,
      'joinedAt',private.iso(m.joined_at)) order by m.joined_at),'[]'::jsonb) into members
    from public.room_members m join public.profiles p on p.id = m.user_id where m.room_id = selected_group;
    select coalesce(jsonb_agg(jsonb_build_object('id',t.id,'title',t.title,'courseId',t.course_id,
      'course',jsonb_build_object('id',c.id,'name',c.name,'shortName',c.short_name,'color',c.color),
      'dueAt',private.iso(t.due_at),'notes',t.notes,'priority',t.priority,'createdBy',t.created_by,'allMembers',t.all_members,
      'assignments',coalesce((select jsonb_agg(jsonb_build_object('memberId',a.member_id,'status',a.status,
        'progress',a.progress,'version',a.version,'updatedAt',private.iso(a.updated_at),'updatedBy',a.updated_by) order by a.member_id)
        from public.task_assignments a where a.task_id = t.id),'[]'::jsonb)) order by t.due_at),'[]'::jsonb) into tasks
    from public.shared_tasks t join public.courses c on c.user_id = t.created_by and c.id = t.course_id
    where t.room_id = selected_group;
    detail := jsonb_build_object('group',private.room_summary(selected_group),'members',members,'tasks',tasks);
  end if;
  return jsonb_build_object('viewer',(select jsonb_build_object('id',id,'displayName',display_name) from public.profiles where id = actor_id),
    'groups',groups,'inbox',inbox,'detail',detail);
end;
$$;

commit;
