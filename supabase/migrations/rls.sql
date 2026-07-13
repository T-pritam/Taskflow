
create or replace function public.auth_role()
returns user_role language sql stable security definer set search_path = public
as $$ select role from profiles where id = auth.uid() $$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from profiles where id = auth.uid() and role = 'admin') $$;

alter table profiles         enable row level security;
alter table invites          enable row level security;
alter table sections         enable row level security;
alter table labels           enable row level security;
alter table tasks            enable row level security;
alter table task_labels      enable row level security;
alter table comments         enable row level security;
alter table task_attachments enable row level security;
alter table notifications    enable row level security;
alter table task_shares      enable row level security;
alter table task_activity    enable row level security;


create policy profiles_select on profiles for select using (auth_role() is not null);
create policy profiles_update on profiles for update
  using (id = auth.uid() or is_admin())
  with check (id = auth.uid() or is_admin());


create policy invites_insert on invites for insert with check (
  (is_admin() and role in ('project_manager','developer'))
  or (auth_role() = 'project_manager' and role = 'developer')
);
create policy invites_select on invites for select
  using (is_admin() or invited_by = auth.uid());
create policy invites_delete on invites for delete
  using (is_admin() or invited_by = auth.uid());


create policy sections_select on sections for select using (auth_role() is not null);
create policy sections_insert on sections for insert
  with check (auth_role() is not null and created_by = auth.uid());
create policy sections_modify on sections for update using (is_admin() or created_by = auth.uid());
create policy sections_delete on sections for delete using (is_admin() or created_by = auth.uid());

create policy labels_select on labels for select using (auth_role() is not null);
create policy labels_insert on labels for insert with check (auth_role() is not null);


create policy tasks_select on tasks for select using (
  is_admin() or restricted_to_role is null or restricted_to_role = auth_role()
);
create policy tasks_insert on tasks for insert with check (
  auth_role() is not null
  and created_by = auth.uid()
  and (restricted_to_role is null or is_admin())
);
create policy tasks_update on tasks for update
  using (
    (is_admin() or created_by = auth.uid() or assignee_id = auth.uid() or auth_role() = 'project_manager')
    and (is_admin() or restricted_to_role is null or restricted_to_role = auth_role())
  )
  with check (
    (is_admin() or created_by = auth.uid() or assignee_id = auth.uid() or auth_role() = 'project_manager')
    and (is_admin() or restricted_to_role is null or restricted_to_role = auth_role())
  );
create policy tasks_delete on tasks for delete using (is_admin() or created_by = auth.uid());


create policy tl_select on task_labels for select
  using (exists (select 1 from tasks t where t.id = task_id));
create policy tl_insert on task_labels for insert
  with check (exists (select 1 from tasks t where t.id = task_id and (is_admin() or t.created_by = auth.uid())));
create policy tl_delete on task_labels for delete
  using (exists (select 1 from tasks t where t.id = task_id and (is_admin() or t.created_by = auth.uid())));


create policy comments_select on comments for select
  using (exists (select 1 from tasks t where t.id = task_id));
create policy comments_insert on comments for insert with check (
  author_id = auth.uid() and exists (select 1 from tasks t where t.id = task_id)
);


create policy att_select on task_attachments for select
  using (exists (select 1 from tasks t where t.id = task_id));
create policy att_insert on task_attachments for insert
  with check (exists (select 1 from tasks t where t.id = task_id and (is_admin() or t.created_by = auth.uid())));
create policy att_delete on task_attachments for delete
  using (exists (select 1 from tasks t where t.id = task_id and (is_admin() or t.created_by = auth.uid())));


create policy notif_select on notifications for select using (user_id = auth.uid());
create policy notif_update on notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());


create policy share_insert on task_shares for insert
  with check (created_by = auth.uid() and exists (select 1 from tasks t where t.id = task_id));
create policy share_select on task_shares for select
  using (exists (select 1 from tasks t where t.id = task_id));


create policy task_activity_select on task_activity for select
  using (exists (select 1 from tasks t where t.id = task_id));


insert into storage.buckets (id, name, public)
values ('task-files', 'task-files', false)
on conflict (id) do nothing;

create policy "upload task files" on storage.objects for insert to authenticated with check (
  bucket_id = 'task-files'
  and exists (select 1 from tasks t
              where t.id = ((storage.foldername(name))[1])::uuid
                and (is_admin() or t.created_by = auth.uid()))
);
create policy "read task files" on storage.objects for select to authenticated using (
  bucket_id = 'task-files'
  and exists (select 1 from tasks t where t.id = ((storage.foldername(name))[1])::uuid)
);
