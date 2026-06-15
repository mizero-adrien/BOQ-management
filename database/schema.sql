-- =================================================================
-- SITEFLOW DATABASE SCHEMA
-- Run this entire file in your Supabase SQL editor
-- Project: Construction site management for East Africa
-- =================================================================


-- =================================================================
-- EXTENSIONS
-- =================================================================

create extension if not exists "uuid-ossp";


-- =================================================================
-- ENUMS
-- =================================================================

create type user_role as enum (
  'engineer',
  'pm',
  'owner',
  'foreman',
  'qs',
  'storekeeper'
);

create type project_status as enum (
  'active',
  'completed',
  'on_hold',
  'cancelled'
);

create type task_status as enum (
  'not_started',
  'in_progress',
  'done',
  'overdue'
);

create type report_status as enum (
  'draft',
  'submitted'
);

create type zone_status as enum (
  'not_started',
  'in_progress',
  'done',
  'issue_flagged'
);

create type boq_item_status as enum (
  'not_started',
  'in_progress',
  'done',
  'over_budget'
);

create type notification_type as enum (
  'task_assigned',
  'report_submitted',
  'report_reminder',
  'budget_alert',
  'issue_flagged',
  'comment_added',
  'milestone_reached'
);

create type weather_condition as enum (
  'sunny',
  'cloudy',
  'rainy',
  'windy',
  'stormy'
);


-- =================================================================
-- TABLE 1: PROFILES
-- Extends Supabase auth.users one-to-one
-- =================================================================

create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  phone text,
  role user_role not null default 'engineer',
  avatar_url text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

comment on table profiles is 'One profile per authenticated user. Extends auth.users.';


-- =================================================================
-- TABLE 2: COMPANIES
-- A construction firm. Multiple users belong to one company.
-- =================================================================

create table companies (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  country text not null default 'Rwanda',
  currency text not null default 'RWF',
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

comment on table companies is 'A construction company. All projects belong to a company.';


-- =================================================================
-- TABLE 3: COMPANY MEMBERS
-- Links users to companies with a role
-- =================================================================

create table company_members (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references companies on delete cascade not null,
  user_id uuid references profiles on delete cascade not null,
  role user_role not null default 'engineer',
  joined_at timestamp with time zone default now() not null,
  unique(company_id, user_id)
);

comment on table company_members is 'Many-to-many between companies and profiles.';


-- =================================================================
-- TABLE 4: PROJECTS
-- A construction project. Central table everything connects to.
-- =================================================================

create table projects (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references companies on delete cascade not null,
  pm_id uuid references profiles on delete restrict not null,
  name text not null,
  location text not null,
  client_name text not null,
  status project_status not null default 'active',
  start_date date not null,
  expected_end_date date not null,
  share_token uuid default uuid_generate_v4() unique not null,
  plan_image_url text,
  overall_progress numeric(5,2) default 0 check (overall_progress >= 0 and overall_progress <= 100),
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

comment on table projects is 'A construction project. share_token is used for the public owner dashboard link.';


-- =================================================================
-- TABLE 5: PROJECT MEMBERS
-- Links engineers and other roles to a specific project
-- =================================================================

create table project_members (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects on delete cascade not null,
  user_id uuid references profiles on delete cascade not null,
  role user_role not null default 'engineer',
  assigned_at timestamp with time zone default now() not null,
  unique(project_id, user_id)
);

comment on table project_members is 'Which users are assigned to which projects.';


-- =================================================================
-- TABLE 6: PLAN ZONES
-- Named zones drawn on the floor plan image
-- Coordinates stored as percentages so they scale on any screen
-- =================================================================

create table plan_zones (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects on delete cascade not null,
  name text not null,
  x_pct numeric(6,3) not null check (x_pct >= 0 and x_pct <= 100),
  y_pct numeric(6,3) not null check (y_pct >= 0 and y_pct <= 100),
  width_pct numeric(6,3) not null check (width_pct > 0 and width_pct <= 100),
  height_pct numeric(6,3) not null check (height_pct > 0 and height_pct <= 100),
  color text not null default '#778EDE',
  status zone_status not null default 'not_started',
  progress_pct numeric(5,2) default 0 check (progress_pct >= 0 and progress_pct <= 100),
  order_index integer default 0,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

comment on table plan_zones is 'Zones drawn on top of the floor plan image. Coordinates are percentages of the image dimensions.';


-- =================================================================
-- TABLE 7: TASKS
-- Jobs assigned by PM to engineers
-- =================================================================

create table tasks (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects on delete cascade not null,
  assigned_to uuid references profiles on delete restrict not null,
  created_by uuid references profiles on delete restrict not null,
  zone_id uuid references plan_zones on delete set null,
  title text not null,
  description text,
  due_date date not null,
  status task_status not null default 'not_started',
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

comment on table tasks is 'Tasks created by PM and assigned to engineers. Optionally linked to a floor plan zone.';


-- =================================================================
-- TABLE 8: DAILY REPORTS
-- One report per engineer per day per project
-- This is the most written-to table in the system
-- =================================================================

create table daily_reports (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects on delete cascade not null,
  engineer_id uuid references profiles on delete restrict not null,
  zone_id uuid references plan_zones on delete set null,
  report_date date not null default current_date,
  workers_count integer not null default 0 check (workers_count >= 0),
  progress_pct numeric(5,2) not null default 0 check (progress_pct >= 0 and progress_pct <= 100),
  notes text,
  issues text,
  weather weather_condition,
  status report_status not null default 'draft',
  submitted_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  unique(project_id, engineer_id, report_date)
);

comment on table daily_reports is 'One report per engineer per project per day. Unique constraint prevents duplicate submissions.';


-- =================================================================
-- TABLE 9: REPORT PHOTOS
-- Photos attached to a daily report
-- =================================================================

create table report_photos (
  id uuid default uuid_generate_v4() primary key,
  report_id uuid references daily_reports on delete cascade not null,
  url text not null,
  caption text,
  file_size_kb integer default 0,
  uploaded_at timestamp with time zone default now() not null
);

comment on table report_photos is 'Site photos attached to daily reports. URLs point to Supabase Storage.';


-- =================================================================
-- TABLE 10: BOQ SECTIONS
-- Groups of line items in the bill of quantities
-- e.g. Demolition, Block masonry, Wall painting
-- =================================================================

create table boq_sections (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects on delete cascade not null,
  title text not null,
  order_index integer not null default 0,
  status text not null default 'not_started',
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

comment on table boq_sections is 'Sections of the bill of quantities. Each section contains multiple line items.';


-- =================================================================
-- TABLE 11: BOQ ITEMS
-- Individual line items in the bill of quantities
-- e.g. Cement bags, Mason labour days, Sand trucks
-- =================================================================

create table boq_items (
  id uuid default uuid_generate_v4() primary key,
  section_id uuid references boq_sections on delete cascade not null,
  description text not null,
  unit text not null,
  quantity numeric(12,3) not null default 0,
  unit_rate numeric(12,2) not null default 0,
  budgeted_total numeric(14,2) generated always as (quantity * unit_rate) stored,
  used_quantity numeric(12,3) not null default 0,
  used_total numeric(14,2) not null default 0,
  status boq_item_status not null default 'not_started',
  order_index integer not null default 0,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

comment on table boq_items is 'Individual line items in the BOQ. budgeted_total is computed. used_total is updated when material logs are added.';


-- =================================================================
-- TABLE 12: MATERIAL LOGS
-- Daily material and labour usage logged by engineers
-- Links a daily report to specific BOQ items
-- This is how live BOQ tracking works
-- =================================================================

create table material_logs (
  id uuid default uuid_generate_v4() primary key,
  report_id uuid references daily_reports on delete cascade not null,
  boq_item_id uuid references boq_items on delete restrict not null,
  quantity_used numeric(12,3) not null check (quantity_used > 0),
  cost_rwf numeric(14,2) not null default 0,
  notes text,
  logged_at timestamp with time zone default now() not null
);

comment on table material_logs is 'Every time an engineer logs materials or labour used on site, a row is created here. This drives the live BOQ vs actual tracking.';


-- =================================================================
-- TABLE 13: NOTIFICATIONS
-- In-app alerts for all roles
-- =================================================================

create table notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles on delete cascade not null,
  project_id uuid references projects on delete cascade not null,
  type notification_type not null,
  title text not null,
  body text not null,
  read boolean not null default false,
  action_url text,
  created_at timestamp with time zone default now() not null
);

comment on table notifications is 'In-app notifications for all user roles. Supabase Realtime watches this table for live updates.';


-- =================================================================
-- INDEXES
-- Speed up the most common queries
-- =================================================================

-- Profiles
create index idx_profiles_role on profiles(role);

-- Company members
create index idx_company_members_company on company_members(company_id);
create index idx_company_members_user on company_members(user_id);

-- Projects
create index idx_projects_company on projects(company_id);
create index idx_projects_pm on projects(pm_id);
create index idx_projects_status on projects(status);
create index idx_projects_share_token on projects(share_token);

-- Project members
create index idx_project_members_project on project_members(project_id);
create index idx_project_members_user on project_members(user_id);

-- Plan zones
create index idx_plan_zones_project on plan_zones(project_id);

-- Tasks
create index idx_tasks_project on tasks(project_id);
create index idx_tasks_assigned_to on tasks(assigned_to);
create index idx_tasks_status on tasks(status);
create index idx_tasks_due_date on tasks(due_date);

-- Daily reports
create index idx_daily_reports_project on daily_reports(project_id);
create index idx_daily_reports_engineer on daily_reports(engineer_id);
create index idx_daily_reports_date on daily_reports(report_date);
create index idx_daily_reports_status on daily_reports(status);

-- Report photos
create index idx_report_photos_report on report_photos(report_id);

-- BOQ sections
create index idx_boq_sections_project on boq_sections(project_id);
create index idx_boq_sections_order on boq_sections(project_id, order_index);

-- BOQ items
create index idx_boq_items_section on boq_items(section_id);

-- Material logs
create index idx_material_logs_report on material_logs(report_id);
create index idx_material_logs_boq_item on material_logs(boq_item_id);

-- Notifications
create index idx_notifications_user on notifications(user_id);
create index idx_notifications_unread on notifications(user_id, read) where read = false;
create index idx_notifications_project on notifications(project_id);


-- =================================================================
-- FUNCTIONS AND TRIGGERS
-- =================================================================

-- Function: auto-create profile when user signs up
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'engineer')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();


-- Function: update updated_at timestamp automatically
create or replace function handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply updated_at trigger to all relevant tables
create trigger set_updated_at before update on profiles
  for each row execute procedure handle_updated_at();

create trigger set_updated_at before update on companies
  for each row execute procedure handle_updated_at();

create trigger set_updated_at before update on projects
  for each row execute procedure handle_updated_at();

create trigger set_updated_at before update on plan_zones
  for each row execute procedure handle_updated_at();

create trigger set_updated_at before update on tasks
  for each row execute procedure handle_updated_at();

create trigger set_updated_at before update on daily_reports
  for each row execute procedure handle_updated_at();

create trigger set_updated_at before update on boq_sections
  for each row execute procedure handle_updated_at();

create trigger set_updated_at before update on boq_items
  for each row execute procedure handle_updated_at();


-- Function: when a material log is inserted, update boq_items used totals
create or replace function update_boq_item_on_material_log()
returns trigger
language plpgsql
as $$
begin
  update boq_items
  set
    used_quantity = used_quantity + new.quantity_used,
    used_total = used_total + new.cost_rwf,
    updated_at = now()
  where id = new.boq_item_id;
  return new;
end;
$$;

create trigger on_material_log_inserted
  after insert on material_logs
  for each row execute procedure update_boq_item_on_material_log();


-- Function: when a daily report is submitted, update the zone progress
create or replace function update_zone_on_report_submitted()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'submitted' and new.zone_id is not null then
    update plan_zones
    set
      progress_pct = new.progress_pct,
      status = case
        when new.progress_pct >= 100 then 'done'::zone_status
        when new.progress_pct > 0 then 'in_progress'::zone_status
        else 'not_started'::zone_status
      end,
      updated_at = now()
    where id = new.zone_id;
  end if;
  return new;
end;
$$;

create trigger on_report_submitted
  after insert or update on daily_reports
  for each row execute procedure update_zone_on_report_submitted();


-- Function: recalculate overall project progress from all zone progress values
create or replace function update_project_progress()
returns trigger
language plpgsql
as $$
declare
  avg_progress numeric;
begin
  select coalesce(avg(progress_pct), 0)
  into avg_progress
  from plan_zones
  where project_id = (
    select project_id from plan_zones where id = new.id
  );

  update projects
  set
    overall_progress = avg_progress,
    updated_at = now()
  where id = (
    select project_id from plan_zones where id = new.id
  );

  return new;
end;
$$;

create trigger on_zone_progress_updated
  after update on plan_zones
  for each row
  when (old.progress_pct is distinct from new.progress_pct)
  execute procedure update_project_progress();


-- =================================================================
-- ROW LEVEL SECURITY
-- =================================================================

-- Enable RLS on every table
alter table profiles enable row level security;
alter table companies enable row level security;
alter table company_members enable row level security;
alter table projects enable row level security;
alter table project_members enable row level security;
alter table plan_zones enable row level security;
alter table tasks enable row level security;
alter table daily_reports enable row level security;
alter table report_photos enable row level security;
alter table boq_sections enable row level security;
alter table boq_items enable row level security;
alter table material_logs enable row level security;
alter table notifications enable row level security;


-- PROFILES policies
create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);


-- COMPANIES policies
create policy "Company members can view their company"
  on companies for select
  using (
    id in (
      select company_id from company_members where user_id = auth.uid()
    )
  );

create policy "Authenticated users can create companies"
  on companies for insert
  with check (auth.uid() is not null);


-- COMPANY MEMBERS policies
create policy "Members can view others in their company"
  on company_members for select
  using (
    company_id in (
      select company_id from company_members where user_id = auth.uid()
    )
  );

create policy "Users can join their company"
  on company_members for insert
  with check (user_id = auth.uid());


-- PROJECTS policies
create policy "Project members can view their projects"
  on projects for select
  using (
    id in (
      select project_id from project_members where user_id = auth.uid()
    )
    or pm_id = auth.uid()
  );

create policy "PMs can create projects"
  on projects for insert
  with check (pm_id = auth.uid());

create policy "PMs can update their projects"
  on projects for update
  using (pm_id = auth.uid());


-- PROJECT MEMBERS policies
create policy "Project members can view project team"
  on project_members for select
  using (
    project_id in (
      select project_id from project_members where user_id = auth.uid()
    )
  );

create policy "PMs can add members to their projects"
  on project_members for insert
  with check (
    project_id in (
      select id from projects where pm_id = auth.uid()
    )
  );


-- PLAN ZONES policies
create policy "Project members can view plan zones"
  on plan_zones for select
  using (
    project_id in (
      select project_id from project_members where user_id = auth.uid()
    )
  );

create policy "PMs can manage plan zones"
  on plan_zones for all
  using (
    project_id in (
      select id from projects where pm_id = auth.uid()
    )
  );


-- TASKS policies
create policy "Engineers can view their assigned tasks"
  on tasks for select
  using (
    assigned_to = auth.uid()
    or created_by = auth.uid()
    or project_id in (
      select id from projects where pm_id = auth.uid()
    )
  );

create policy "PMs can create and manage tasks"
  on tasks for all
  using (
    project_id in (
      select id from projects where pm_id = auth.uid()
    )
  );

create policy "Engineers can update task status"
  on tasks for update
  using (assigned_to = auth.uid());


-- DAILY REPORTS policies
create policy "Engineers can view and create their own reports"
  on daily_reports for select
  using (
    engineer_id = auth.uid()
    or project_id in (
      select id from projects where pm_id = auth.uid()
    )
  );

create policy "Engineers can insert their own reports"
  on daily_reports for insert
  with check (engineer_id = auth.uid());

create policy "Engineers can update their draft reports"
  on daily_reports for update
  using (engineer_id = auth.uid() and status = 'draft');


-- REPORT PHOTOS policies
create policy "Project members can view report photos"
  on report_photos for select
  using (
    report_id in (
      select id from daily_reports
      where engineer_id = auth.uid()
      or project_id in (
        select id from projects where pm_id = auth.uid()
      )
    )
  );

create policy "Engineers can upload photos to their reports"
  on report_photos for insert
  with check (
    report_id in (
      select id from daily_reports where engineer_id = auth.uid()
    )
  );


-- BOQ SECTIONS policies
create policy "Project members can view BOQ sections"
  on boq_sections for select
  using (
    project_id in (
      select project_id from project_members where user_id = auth.uid()
    )
    or project_id in (
      select id from projects where pm_id = auth.uid()
    )
  );

create policy "PMs and QS can manage BOQ sections"
  on boq_sections for all
  using (
    project_id in (
      select id from projects where pm_id = auth.uid()
    )
  );


-- BOQ ITEMS policies
create policy "Project members can view BOQ items"
  on boq_items for select
  using (
    section_id in (
      select id from boq_sections
      where project_id in (
        select project_id from project_members where user_id = auth.uid()
      )
    )
  );

create policy "PMs and QS can manage BOQ items"
  on boq_items for all
  using (
    section_id in (
      select id from boq_sections
      where project_id in (
        select id from projects where pm_id = auth.uid()
      )
    )
  );


-- MATERIAL LOGS policies
create policy "Project members can view material logs"
  on material_logs for select
  using (
    report_id in (
      select id from daily_reports
      where project_id in (
        select project_id from project_members where user_id = auth.uid()
      )
    )
  );

create policy "Engineers can insert material logs for their reports"
  on material_logs for insert
  with check (
    report_id in (
      select id from daily_reports where engineer_id = auth.uid()
    )
  );


-- NOTIFICATIONS policies
create policy "Users can view their own notifications"
  on notifications for select
  using (user_id = auth.uid());

create policy "Users can mark their notifications as read"
  on notifications for update
  using (user_id = auth.uid());


-- =================================================================
-- PUBLIC ACCESS FOR OWNER SHARE DASHBOARD
-- Allow reading project data via share_token without auth
-- =================================================================

create policy "Public can view project by share token"
  on projects for select
  using (true);

create policy "Public can view zones for shared project"
  on plan_zones for select
  using (true);

create policy "Public can view reports for shared project"
  on daily_reports for select
  using (true);

create policy "Public can view report photos for shared project"
  on report_photos for select
  using (true);

create policy "Public can view BOQ sections for shared project"
  on boq_sections for select
  using (true);

create policy "Public can view BOQ items for shared project"
  on boq_items for select
  using (true);


-- =================================================================
-- REALTIME
-- Enable realtime on tables that need live updates
-- =================================================================

alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table daily_reports;
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table plan_zones;
alter publication supabase_realtime add table boq_items;


-- =================================================================
-- STORAGE BUCKETS
-- Run these in the Supabase dashboard Storage section
-- or use the Supabase JS client to create them
-- =================================================================

-- Create these two storage buckets in your Supabase dashboard:
-- 1. "report-photos" - public bucket for site photos
-- 2. "plan-images" - public bucket for floor plan uploads
-- Both should have the following policy:
-- Allow authenticated users to upload
-- Allow public read access


-- =================================================================
-- END OF SCHEMA
-- =================================================================
