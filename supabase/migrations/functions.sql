
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare inv record;
begin
  select * into inv from invites
    where email = new.email and status = 'pending'
    order by created_at desc limit 1;

  insert into profiles (id, email, full_name, avatar_url, role)
  values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    inv.role
  );

  if inv.id is not null then
    update invites set status = 'accepted' where id = inv.id;
  end if;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


create or replace function public.enforce_task_edit_rules()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if is_admin() or old.created_by = auth.uid() then
    return new;
  end if;
  if new.title              is distinct from old.title
     or new.description        is distinct from old.description
     or new.section_id         is distinct from old.section_id
     or new.priority           is distinct from old.priority
     or new.due_date           is distinct from old.due_date
     or new.assignee_id        is distinct from old.assignee_id
     or new.created_by         is distinct from old.created_by
     or new.restricted_to_role is distinct from old.restricted_to_role
  then
    raise exception 'You can only change the status of this task';
  end if;
  return new;
end $$;

create trigger tasks_enforce_edit
  before update on tasks
  for each row execute function public.enforce_task_edit_rules();

create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not is_admin() then
    if old.role is null and exists (
      select 1 from invites i
      where i.email = new.email and i.role = new.role and i.status = 'pending'
    ) then
      return new;
    end if;
    raise exception 'Only admins can change roles';
  end if;
  return new;
end $$;

create trigger profiles_guard_role
  before update on profiles
  for each row execute function public.guard_profile_role();


create or replace function public.apply_invite_to_existing_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update profiles set role = new.role
  where email = new.email and role is null;

  if found then
    update invites set status = 'accepted' where id = new.id;
  end if;
  return new;
end $$;

create trigger invites_apply_to_existing
  after insert on invites
  for each row execute function public.apply_invite_to_existing_user();


create extension if not exists pg_cron;

create or replace function public.notify_overdue_tasks()
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into notifications (user_id, type, task_id, message)
  select distinct v.p, 'due_date', t.id, format('Task "%s" is past its due date', t.title)
  from tasks t
  cross join lateral (values (t.created_by), (t.assignee_id)) as v(p)
  where t.due_date is not null
    and t.due_date < now()
    and t.due_date_notified = false
    and v.p is not null;

  update tasks set due_date_notified = true
  where due_date is not null and due_date < now() and due_date_notified = false;
end $$;

revoke execute on function public.notify_overdue_tasks() from public, anon, authenticated;

select cron.schedule('overdue-tasks', '*/15 * * * *', $$ select public.notify_overdue_tasks(); $$);


create or replace function public.get_shared_task(share_token uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare result jsonb;
begin
  select jsonb_build_object(
    'id', t.id, 'title', t.title, 'description', t.description,
    'status', t.status, 'priority', t.priority, 'due_date', t.due_date,
    'created_by_name', p.full_name
  ) into result
  from task_shares s
  join tasks t   on t.id = s.task_id
  left join profiles p on p.id = t.created_by
  where s.token = share_token;
  return result;
end $$;

grant execute on function public.get_shared_task(uuid) to anon, authenticated;


create or replace function public.log_task_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into task_activity (task_id, actor_id, action)
  values (new.id, new.created_by, 'created');
  return new;
end $$;

create trigger tasks_log_insert
  after insert on tasks
  for each row execute function public.log_task_created();

create or replace function public.log_task_updated()
returns trigger language plpgsql security definer set search_path = public as $$
declare actor uuid := auth.uid();
begin
  if new.title is distinct from old.title then
    insert into task_activity (task_id, actor_id, action, field, old_value, new_value)
    values (new.id, actor, 'updated', 'title', old.title, new.title);
  end if;
  if new.description is distinct from old.description then
    insert into task_activity (task_id, actor_id, action, field, old_value, new_value)
    values (new.id, actor, 'updated', 'description', old.description, new.description);
  end if;
  if new.status is distinct from old.status then
    insert into task_activity (task_id, actor_id, action, field, old_value, new_value)
    values (new.id, actor, 'updated', 'status', old.status::text, new.status::text);
  end if;
  if new.priority is distinct from old.priority then
    insert into task_activity (task_id, actor_id, action, field, old_value, new_value)
    values (new.id, actor, 'updated', 'priority', old.priority::text, new.priority::text);
  end if;
  if new.due_date is distinct from old.due_date then
    insert into task_activity (task_id, actor_id, action, field, old_value, new_value)
    values (new.id, actor, 'updated', 'due_date',
            to_char(old.due_date at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
            to_char(new.due_date at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'));
  end if;
  if new.section_id is distinct from old.section_id then
    insert into task_activity (task_id, actor_id, action, field, old_value, new_value)
    values (new.id, actor, 'updated', 'section_id', old.section_id::text, new.section_id::text);
  end if;
  if new.restricted_to_role is distinct from old.restricted_to_role then
    insert into task_activity (task_id, actor_id, action, field, old_value, new_value)
    values (new.id, actor, 'updated', 'restricted_to_role',
            old.restricted_to_role::text, new.restricted_to_role::text);
  end if;
  if new.assignee_id is distinct from old.assignee_id then
    insert into task_activity (task_id, actor_id, action, field, old_value, new_value)
    values (new.id, actor,
            case when new.assignee_id is null then 'unassigned' else 'assigned' end,
            'assignee_id', old.assignee_id::text, new.assignee_id::text);
  end if;
  return new;
end $$;

create trigger tasks_log_update
  after update on tasks
  for each row execute function public.log_task_updated();

create or replace function public.log_comment_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into task_activity (task_id, actor_id, action)
  values (new.task_id, new.author_id, 'commented');
  return new;
end $$;

create trigger comments_log_insert
  after insert on comments
  for each row execute function public.log_comment_created();
