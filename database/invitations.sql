-- Company members table (tracks which users belong to which company)
create table if not exists company_members (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references companies on delete cascade not null,
  user_id uuid references profiles on delete cascade not null,
  role user_role not null default 'engineer',
  joined_at timestamp with time zone default now() not null,
  unique(company_id, user_id)
);

alter table company_members enable row level security;

create policy "Members can view their company"
  on company_members for select
  using (user_id = auth.uid());

create policy "PMs can manage company members"
  on company_members for all
  using (true);

grant all on company_members to authenticated;

-- Invitations table
create table if not exists invitations (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects on delete cascade not null,
  company_id uuid references companies on delete cascade not null,
  invited_by uuid references profiles on delete cascade not null,
  email text not null,
  role user_role not null default 'engineer',
  token uuid default uuid_generate_v4() unique not null,
  accepted boolean not null default false,
  created_at timestamp with time zone default now() not null,
  expires_at timestamp with time zone default (now() + interval '7 days') not null
);

alter table invitations enable row level security;

create policy "PMs can create invitations"
  on invitations for insert
  with check (invited_by = auth.uid());

create policy "Anyone can view invitation by token"
  on invitations for select
  using (true);

create policy "System can update invitation accepted status"
  on invitations for update
  using (true);

grant all on invitations to authenticated;
grant select on invitations to anon;
