-- Add last_active_project_id to profiles
alter table profiles
add column if not exists last_active_project_id uuid
references projects(id) on delete set null;

-- Update update_user_role to only touch global role when user is pending.
-- profiles.role is now only a fallback; project_members.role is source of truth.
create or replace function update_user_role(
  target_user_id uuid,
  new_role user_role,
  target_project_id uuid default null
)
returns void
language plpgsql
security definer
as $$
declare
  v_current_role user_role;
begin
  select role into v_current_role
  from public.profiles
  where id = target_user_id;

  -- Always update project_members if project_id provided
  if target_project_id is not null then
    update public.project_members
    set role = new_role
    where user_id = target_user_id
    and project_id = target_project_id;
  end if;

  -- Only update global profile role if user is pending (brand-new user accepting first invite)
  if v_current_role = 'pending' then
    update public.profiles
    set role = new_role
    where id = target_user_id;

    update auth.users
    set raw_user_meta_data = raw_user_meta_data ||
      jsonb_build_object('role', new_role::text, 'has_company', true)
    where id = target_user_id;
  end if;
end;
$$;

grant execute on function update_user_role(uuid, user_role, uuid) to authenticated;

-- Returns all active/on_hold projects for a user with their role on each project
create or replace function get_user_projects(p_user_id uuid)
returns table (
  project_id uuid,
  project_name text,
  project_status text,
  project_location text,
  overall_progress numeric,
  user_role user_role,
  assigned_at timestamptz,
  company_name text,
  pm_name text,
  pm_id uuid
)
language plpgsql
security definer
stable
as $$
begin
  return query
  select
    p.id as project_id,
    p.name as project_name,
    p.status as project_status,
    p.location as project_location,
    p.overall_progress,
    pm.role as user_role,
    pm.assigned_at,
    c.name as company_name,
    prof.full_name as pm_name,
    p.pm_id
  from project_members pm
  join projects p on p.id = pm.project_id
  join companies c on c.id = p.company_id
  join profiles prof on prof.id = p.pm_id
  where pm.user_id = p_user_id
  and p.status in ('active', 'on_hold')
  order by pm.assigned_at desc;
end;
$$;

grant execute on function get_user_projects(uuid) to authenticated;

-- Persists the last active project selection for a user
create or replace function set_active_project(
  p_user_id uuid,
  p_project_id uuid
)
returns void
language plpgsql
security definer
as $$
begin
  update public.profiles
  set last_active_project_id = p_project_id
  where id = p_user_id;
end;
$$;

grant execute on function set_active_project(uuid, uuid) to authenticated;
