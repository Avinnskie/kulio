begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 60),
  created_at timestamptz not null default now()
);
create sequence private.personal_revision_seq as integer minvalue 0 start 0;
create table public.personal_tasks (
  id uuid primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 2 and 100),
  course_id text not null check (course_id in ('struktur-data','basis-data','interaksi-manusia-komputer','pemrograman-web')),
  due_at timestamptz not null check (due_at >= '0001-01-01 00:00:00+00'::timestamptz and due_at < '10000-01-01 00:00:00+00'::timestamptz),
  status text not null check (status in ('belum_selesai','dikerjakan','selesai')),
  priority text not null check (priority in ('rendah','sedang','tinggi')),
  progress integer not null check (progress between 0 and 100),
  notes text not null default '' check (char_length(notes) <= 400),
  created_at timestamptz not null default now() check (created_at >= '0001-01-01 00:00:00+00'::timestamptz and created_at < '10000-01-01 00:00:00+00'::timestamptz),
  revision integer not null default nextval('private.personal_revision_seq') check (revision >= 0),
  check ((status = 'selesai' and progress = 100) or (status = 'belum_selesai' and progress = 0) or (status = 'dikerjakan' and progress < 100))
);
create index personal_tasks_user on public.personal_tasks(user_id, due_at);
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 2 and 80),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table public.room_members (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner','member')),
  joined_at timestamptz not null default now(),
  primary key (room_id,user_id)
);
create index room_members_user on public.room_members(user_id);
create table public.room_invites (
  room_id uuid primary key references public.rooms(id) on delete cascade,
  code text not null unique check (code ~ '^[A-F0-9]{16}$'),
  expires_at timestamptz not null default now() + interval '7 days'
);
create table public.shared_tasks (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 2 and 100),
  course_id text not null check (course_id in ('struktur-data','basis-data','interaksi-manusia-komputer','pemrograman-web')),
  due_at timestamptz not null check (due_at >= '0001-01-01 00:00:00+00'::timestamptz and due_at < '10000-01-01 00:00:00+00'::timestamptz),
  notes text not null default '' check (char_length(notes) <= 400),
  priority text not null check (priority in ('rendah','sedang','tinggi')),
  created_by uuid not null references public.profiles(id) on delete cascade,
  all_members boolean not null default true,
  created_at timestamptz not null default now(),
  unique (id, room_id)
);
create index shared_tasks_room on public.shared_tasks(room_id, due_at);
create table public.task_assignments (
  task_id uuid not null,
  room_id uuid not null,
  member_id uuid not null,
  status text not null default 'belum_selesai' check (status in ('belum_selesai','dikerjakan','selesai')),
  progress integer not null default 0 check (progress between 0 and 100),
  version integer not null default 0,
  updated_at timestamptz not null default now(),
  updated_by uuid not null references public.profiles(id) on delete cascade,
  primary key (task_id,member_id),
  foreign key (task_id, room_id) references public.shared_tasks(id, room_id) on delete cascade,
  foreign key (room_id,member_id) references public.room_members(room_id,user_id) on delete cascade
);
create table public.member_reminders (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  task_id uuid not null,
  from_id uuid not null references public.profiles(id) on delete cascade,
  to_id uuid not null,
  message text not null check (char_length(btrim(message)) between 1 and 300),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  foreign key (task_id, room_id) references public.shared_tasks(id, room_id) on delete cascade,
  foreign key (room_id,to_id) references public.room_members(room_id,user_id) on delete cascade
);
create index member_reminders_recipient on public.member_reminders(to_id, created_at desc);
create index member_reminders_throttle on public.member_reminders(from_id, to_id, task_id, created_at desc);
create table private.request_limits (
  user_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  started_at timestamptz not null default now(),
  count integer not null default 1,
  primary key (user_id, action)
);

alter table public.profiles enable row level security;
alter table public.personal_tasks enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.room_invites enable row level security;
alter table public.shared_tasks enable row level security;
alter table public.task_assignments enable row level security;
alter table public.member_reminders enable row level security;
alter table private.request_limits enable row level security;
revoke all on public.profiles, public.personal_tasks, public.rooms, public.room_members,
  public.room_invites, public.shared_tasks, public.task_assignments, public.member_reminders from public, anon, authenticated;
grant select on public.profiles to authenticated;
create policy own_profile on public.profiles for select to authenticated using (id = (select auth.uid()));

create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare label text;
begin
  label := btrim(new.raw_user_meta_data->>'display_name');
  if label is null or char_length(label) not between 2 and 60 then label := 'Mahasiswa'; end if;
  insert into public.profiles(id,display_name) values (new.id,label);
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
for each row execute function private.handle_new_user();
insert into public.profiles(id,display_name)
select id, case when char_length(btrim(raw_user_meta_data->>'display_name')) between 2 and 60
  then btrim(raw_user_meta_data->>'display_name') else 'Mahasiswa' end
from auth.users on conflict (id) do nothing;
commit;
