begin;

alter table public.courses drop constraint if exists courses_color_check;

create or replace function private.normalize_course_color() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.color := case lower(new.color)
    when 'sage' then '#2F6B47'
    when 'amber' then '#A86714'
    when 'rose' then '#C96782'
    when 'blue' then '#477FB9'
    else upper(new.color)
  end;
  return new;
end;
$$;
revoke all on function private.normalize_course_color() from public;

drop trigger if exists courses_normalize_color on public.courses;
create trigger courses_normalize_color
before insert or update of color on public.courses
for each row execute function private.normalize_course_color();

update public.courses set color = color;

alter table public.courses add constraint courses_color_check
  check (color ~ '^#[0-9A-Fa-f]{6}$');

commit;
