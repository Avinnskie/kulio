begin;
create function private.room_summary(target_room uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id',r.id,'title',r.title,'role',m.role,
    'memberCount',(select count(*) from public.room_members where room_id = r.id),
    'taskCount',(select count(*) from public.shared_tasks where room_id = r.id),
    'inviteCode',case when m.role = 'owner' then i.code else null end,
    'inviteExpiresAt',case when m.role = 'owner' then private.iso(i.expires_at) else null end)
  from public.rooms r join public.room_members m on m.room_id = r.id and m.user_id = auth.uid()
  left join public.room_invites i on i.room_id = r.id where r.id = target_room;
$$;
create function public.workspace_snapshot(selected_group uuid default null) returns jsonb
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
      'dueAt',private.iso(t.due_at),'notes',t.notes,'priority',t.priority,'createdBy',t.created_by,'allMembers',t.all_members,
      'assignments',coalesce((select jsonb_agg(jsonb_build_object('memberId',a.member_id,'status',a.status,
        'progress',a.progress,'version',a.version,'updatedAt',private.iso(a.updated_at),'updatedBy',a.updated_by) order by a.member_id)
        from public.task_assignments a where a.task_id = t.id),'[]'::jsonb)) order by t.due_at),'[]'::jsonb) into tasks
    from public.shared_tasks t where t.room_id = selected_group;
    detail := jsonb_build_object('group',private.room_summary(selected_group),'members',members,'tasks',tasks);
  end if;
  return jsonb_build_object('viewer',(select jsonb_build_object('id',id,'displayName',display_name) from public.profiles where id = actor_id),
    'groups',groups,'inbox',inbox,'detail',detail);
end;
$$;
revoke all on function private.room_summary(uuid) from public, anon, authenticated;
revoke all on function public.workspace_snapshot(uuid) from public, anon;
grant execute on function public.workspace_snapshot(uuid) to authenticated;
commit;
