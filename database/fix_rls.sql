-- Fix infinite recursion in project_members RLS policy
-- The old policy queried project_members from within a project_members policy
-- causing infinite recursion. Fix by using auth.uid() directly.

-- Drop all existing policies (both old names and renamed ones for idempotency)
drop policy if exists "Members can view others in their company" on company_members;
drop policy if exists "Project members can view project team" on project_members;
drop policy if exists "Users can view project members for their projects" on project_members;
drop policy if exists "PMs can add members to their projects" on project_members;
drop policy if exists "PMs can remove members from their projects" on project_members;
drop policy if exists "Users can view their projects" on projects;
drop policy if exists "PMs can create projects" on projects;
drop policy if exists "PMs can update their projects" on projects;
drop policy if exists "Project members can view plan zones" on plan_zones;
drop policy if exists "PMs can manage plan zones" on plan_zones;
drop policy if exists "Users can view their tasks" on tasks;
drop policy if exists "PMs can manage tasks" on tasks;
drop policy if exists "Engineers can update their task status" on tasks;
drop policy if exists "Users can view reports for their projects" on daily_reports;
drop policy if exists "Engineers can insert their own reports" on daily_reports;
drop policy if exists "Engineers can update their draft reports" on daily_reports;
drop policy if exists "Users can view report photos" on report_photos;
drop policy if exists "Engineers can upload photos" on report_photos;
drop policy if exists "Project members can view BOQ sections" on boq_sections;
drop policy if exists "PMs can manage BOQ sections" on boq_sections;
drop policy if exists "Project members can view BOQ items" on boq_items;
drop policy if exists "PMs can manage BOQ items" on boq_items;
drop policy if exists "Project members can view material logs" on material_logs;
drop policy if exists "Engineers can insert material logs" on material_logs;
drop policy if exists "Project members can view their projects" on projects;
drop policy if exists "PMs can create projects" on projects;
drop policy if exists "PMs can update their projects" on projects;
drop policy if exists "Project members can view plan zones" on plan_zones;
drop policy if exists "PMs can manage plan zones" on plan_zones;
drop policy if exists "Engineers can view their assigned tasks" on tasks;
drop policy if exists "PMs can create and manage tasks" on tasks;
drop policy if exists "Engineers can update task status" on tasks;
drop policy if exists "Engineers can view and create their own reports" on daily_reports;
drop policy if exists "Engineers can insert their own reports" on daily_reports;
drop policy if exists "Engineers can update their draft reports" on daily_reports;
drop policy if exists "Project members can view report photos" on report_photos;
drop policy if exists "Engineers can upload photos to their reports" on report_photos;
drop policy if exists "Project members can view BOQ sections" on boq_sections;
drop policy if exists "PMs and QS can manage BOQ sections" on boq_sections;
drop policy if exists "Project members can view BOQ items" on boq_items;
drop policy if exists "PMs and QS can manage BOQ items" on boq_items;
drop policy if exists "Project members can view material logs" on material_logs;
drop policy if exists "Engineers can insert material logs for their reports" on material_logs;
drop policy if exists "Company members can view their company" on companies;
drop policy if exists "Authenticated users can create companies" on companies;

-- Create a security definer function to check project membership
-- This function runs with elevated privileges and does not trigger RLS
-- so it breaks the infinite recursion cycle
create or replace function is_project_member(p_project_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from project_members
    where project_id = p_project_id
    and user_id = auth.uid()
  );
$$;

create or replace function is_project_pm(p_project_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from projects
    where id = p_project_id
    and pm_id = auth.uid()
  );
$$;

create or replace function is_company_member()
returns setof uuid
language sql
security definer
stable
as $$
  select company_id
  from company_members
  where user_id = auth.uid();
$$;

create or replace function get_user_project_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select project_id
  from project_members
  where user_id = auth.uid();
$$;

create or replace function create_company_with_member(
  p_name text,
  p_country text,
  p_currency text
)
returns companies
language plpgsql
security definer
set search_path = public
as $$
declare
  new_company companies;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into companies (name, country, currency)
  values (trim(p_name), p_country, p_currency)
  returning * into new_company;

  insert into company_members (company_id, user_id, role)
  values (new_company.id, auth.uid(), 'pm');

  return new_company;
end;
$$;

-- Recreate companies policies
create policy "Company members can view their company"
  on companies for select
  using (
    id in (select is_company_member())
  );

create policy "Authenticated users can create companies"
  on companies for insert
  with check (auth.uid() is not null);

grant execute on function create_company_with_member(text, text, text) to authenticated;

-- Recreate company_members policy using the security definer function
create policy "Members can view others in their company"
  on company_members for select
  using (
    company_id in (select is_company_member())
  );

-- Recreate project_members policies using the security definer function
create policy "Users can view project members for their projects"
  on project_members for select
  using (
    project_id in (select get_user_project_ids())
    or project_id in (select id from projects where pm_id = auth.uid())
  );

create policy "PMs can add members to their projects"
  on project_members for insert
  with check (
    project_id in (select id from projects where pm_id = auth.uid())
  );

create policy "PMs can remove members from their projects"
  on project_members for delete
  using (
    project_id in (select id from projects where pm_id = auth.uid())
  );

-- Recreate projects policies
create policy "Users can view their projects"
  on projects for select
  using (
    id in (select get_user_project_ids())
    or pm_id = auth.uid()
  );

create policy "PMs can create projects"
  on projects for insert
  with check (pm_id = auth.uid());

create policy "PMs can update their projects"
  on projects for update
  using (pm_id = auth.uid());

-- Recreate plan_zones policies
create policy "Project members can view plan zones"
  on plan_zones for select
  using (
    project_id in (select get_user_project_ids())
    or project_id in (select id from projects where pm_id = auth.uid())
  );

create policy "PMs can manage plan zones"
  on plan_zones for all
  using (
    project_id in (select id from projects where pm_id = auth.uid())
  );

-- Recreate tasks policies
create policy "Users can view their tasks"
  on tasks for select
  using (
    assigned_to = auth.uid()
    or created_by = auth.uid()
    or project_id in (select id from projects where pm_id = auth.uid())
  );

create policy "PMs can manage tasks"
  on tasks for all
  using (
    project_id in (select id from projects where pm_id = auth.uid())
  );

create policy "Engineers can update their task status"
  on tasks for update
  using (assigned_to = auth.uid());

-- Recreate daily_reports policies
create policy "Users can view reports for their projects"
  on daily_reports for select
  using (
    engineer_id = auth.uid()
    or project_id in (select id from projects where pm_id = auth.uid())
    or project_id in (select get_user_project_ids())
  );

create policy "Engineers can insert their own reports"
  on daily_reports for insert
  with check (engineer_id = auth.uid());

create policy "Engineers can update their draft reports"
  on daily_reports for update
  using (engineer_id = auth.uid() and status = 'draft');

-- Recreate report_photos policies
create policy "Users can view report photos"
  on report_photos for select
  using (
    report_id in (
      select id from daily_reports
      where engineer_id = auth.uid()
      or project_id in (select id from projects where pm_id = auth.uid())
      or project_id in (select get_user_project_ids())
    )
  );

create policy "Engineers can upload photos"
  on report_photos for insert
  with check (
    report_id in (
      select id from daily_reports where engineer_id = auth.uid()
    )
  );

-- Recreate boq_sections policies
create policy "Project members can view BOQ sections"
  on boq_sections for select
  using (
    project_id in (select get_user_project_ids())
    or project_id in (select id from projects where pm_id = auth.uid())
  );

create policy "PMs can manage BOQ sections"
  on boq_sections for all
  using (
    project_id in (select id from projects where pm_id = auth.uid())
  );

-- Recreate boq_items policies
create policy "Project members can view BOQ items"
  on boq_items for select
  using (
    section_id in (
      select id from boq_sections
      where project_id in (select get_user_project_ids())
      or project_id in (select id from projects where pm_id = auth.uid())
    )
  );

create policy "PMs can manage BOQ items"
  on boq_items for all
  using (
    section_id in (
      select id from boq_sections
      where project_id in (select id from projects where pm_id = auth.uid())
    )
  );

-- Ensure the report-photos storage bucket exists
insert into storage.buckets (id, name, public)
values ('report-photos', 'report-photos', true)
on conflict (id) do nothing;

-- Recreate material_logs policies
create policy "Project members can view material logs"
  on material_logs for select
  using (
    report_id in (
      select id from daily_reports
      where project_id in (select get_user_project_ids())
      or project_id in (select id from projects where pm_id = auth.uid())
    )
  );

create policy "Engineers can insert material logs"
  on material_logs for insert
  with check (
    report_id in (
      select id from daily_reports where engineer_id = auth.uid()
    )
    or report_id is null
  );
