
create type user_role      as enum ('admin', 'project_manager', 'developer');
create type task_status    as enum ('todo', 'backlog', 'in_progress', 'done');
create type task_priority  as enum ('p1', 'p2', 'p3');
create type invite_status  as enum ('pending', 'accepted');

create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text unique not null,
  full_name  text,
  avatar_url text,
  role       user_role,
  created_at timestamptz default now()
);

create table invites (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  role       user_role not null,
  invited_by uuid not null references profiles(id) default auth.uid(),
  token      uuid not null default gen_random_uuid(),
  status     invite_status not null default 'pending',
  created_at timestamptz default now()
);

create table sections (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  position   int  not null default 0,
  created_by uuid not null references profiles(id) default auth.uid(),
  created_at timestamptz default now()
);

create table labels (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  color      text not null default 'gray',
  created_at timestamptz default now()
);

create table tasks (
  id                 uuid primary key default gen_random_uuid(),
  title              text not null,
  description        text,
  section_id         uuid references sections(id) on delete set null,
  status             task_status not null default 'todo',
  priority           task_priority,
  due_date           timestamptz,
  assignee_id        uuid references profiles(id) on delete set null,
  created_by         uuid not null references profiles(id) default auth.uid(),
  restricted_to_role user_role,
  due_date_notified  boolean not null default false,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

create table task_labels (
  task_id  uuid references tasks(id)  on delete cascade,
  label_id uuid references labels(id) on delete cascade,
  primary key (task_id, label_id)
);

create table comments (
  id                 uuid primary key default gen_random_uuid(),
  task_id            uuid not null references tasks(id) on delete cascade,
  author_id          uuid not null references profiles(id) default auth.uid(),
  body               text not null,
  mentioned_user_ids uuid[] default '{}',
  created_at         timestamptz default now()
);

create table task_attachments (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references tasks(id) on delete cascade,
  file_path   text not null,
  file_name   text not null,
  uploaded_by uuid not null references profiles(id) default auth.uid(),
  created_at  timestamptz default now()
);

create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  type       text not null,
  task_id    uuid references tasks(id) on delete cascade,
  message    text not null,
  read       boolean not null default false,
  created_at timestamptz default now()
);

create table task_shares (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references tasks(id) on delete cascade,
  token      uuid not null unique default gen_random_uuid(),
  created_by uuid not null references profiles(id) default auth.uid(),
  created_at timestamptz default now()
);

create table task_activity (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references tasks(id) on delete cascade,
  actor_id   uuid references profiles(id) on delete set null,
  action     text not null,
  field      text,
  old_value  text,
  new_value  text,
  created_at timestamptz default now()
);
create index task_activity_task_id_idx on task_activity(task_id);
