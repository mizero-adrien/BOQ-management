-- =================================================================
-- ADMIN ROLES
-- Two admin levels: super_admin (full access) and admin (manage users only).
-- Run this entire file in Supabase SQL Editor.
-- =================================================================


-- =================================================================
-- STEP 1 — Add admin roles to user_role enum
-- =================================================================

do $$
begin
  if not exists (
    select 1 from pg_enum
    where enumlabel = 'admin'
    and enumtypid = (select oid from pg_type where typname = 'user_role')
  ) then
    alter type user_role add value 'admin';
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_enum
    where enumlabel = 'super_admin'
    and enumtypid = (select oid from pg_type where typname = 'user_role')
  ) then
    alter type user_role add value 'super_admin';
  end if;
end$$;


-- =================================================================
-- STEP 2 — Suspension + admin bookkeeping columns
-- =================================================================

alter table profiles add column if not exists is_suspended boolean not null default false;
alter table profiles add column if not exists suspended_at timestamptz;
alter table profiles add column if not exists suspension_reason text;

-- Tracks what role a user had before being granted admin access, so
-- revoke_admin_access can restore it instead of dropping them to 'pending'.
alter table profiles add column if not exists previous_role text;

-- Company-level suspension (separate from user suspension — the admin
-- companies list and company detail page both need this independently
-- of any single user being suspended).
alter table companies add column if not exists is_suspended boolean not null default false;
alter table companies add column if not exists suspended_at timestamptz;
alter table companies add column if not exists suspension_reason text;


-- =================================================================
-- STEP 3 — Audit log
-- =================================================================

create table if not exists admin_audit_log (
  id uuid default uuid_generate_v4() primary key,
  admin_id uuid references profiles on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  details jsonb,
  created_at timestamptz default now() not null
);

comment on table admin_audit_log is 'Every admin/super_admin action against a user, company, or project.';

create index if not exists admin_audit_log_created_at_idx on admin_audit_log (created_at desc);
create index if not exists admin_audit_log_target_idx on admin_audit_log (target_type, target_id);

alter table admin_audit_log enable row level security;


-- =================================================================
-- STEP 4 — Admin check helpers (used by RLS policies below)
-- =================================================================

create or replace function is_platform_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role::text in ('admin', 'super_admin')
  );
$$;

create or replace function is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role::text = 'super_admin'
  );
$$;

grant execute on function is_platform_admin() to authenticated;
grant execute on function is_super_admin() to authenticated;


-- =================================================================
-- STEP 5 — Admin/user management functions
-- =================================================================

create or replace function grant_admin_access(
  target_user_id uuid,
  admin_level text,
  granted_by_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_role text;
  v_target_current_role text;
begin
  if admin_level not in ('admin', 'super_admin') then
    raise exception 'admin_level must be admin or super_admin';
  end if;

  select role::text into v_caller_role
  from profiles where id = granted_by_id;

  if v_caller_role != 'super_admin' then
    raise exception 'Only super_admin can grant admin access';
  end if;

  select role::text into v_target_current_role
  from profiles where id = target_user_id;

  if v_target_current_role in ('admin', 'super_admin') then
    raise exception 'User already has admin access';
  end if;

  update profiles
  set
    previous_role = v_target_current_role,
    role = admin_level::user_role
  where id = target_user_id;

  update auth.users
  set raw_user_meta_data = raw_user_meta_data ||
    jsonb_build_object('role', admin_level, 'has_company', true)
  where id = target_user_id;

  insert into admin_audit_log (admin_id, action, target_type, target_id, details)
  values (
    granted_by_id,
    'grant_admin_access',
    'user',
    target_user_id,
    jsonb_build_object('admin_level', admin_level, 'previous_role', v_target_current_role)
  );
end;
$$;

grant execute on function grant_admin_access(uuid, text, uuid) to authenticated;


create or replace function revoke_admin_access(
  target_user_id uuid,
  revoked_by_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_role text;
  v_previous_role text;
begin
  select role::text into v_caller_role
  from profiles where id = revoked_by_id;

  if v_caller_role != 'super_admin' then
    raise exception 'Only super_admin can revoke admin access';
  end if;

  select previous_role into v_previous_role
  from profiles where id = target_user_id;

  update profiles
  set
    role = coalesce(v_previous_role, 'pending')::user_role,
    previous_role = null
  where id = target_user_id;

  update auth.users
  set raw_user_meta_data = raw_user_meta_data ||
    jsonb_build_object('role', coalesce(v_previous_role, 'pending'))
  where id = target_user_id;

  insert into admin_audit_log (admin_id, action, target_type, target_id, details)
  values (
    revoked_by_id,
    'revoke_admin_access',
    'user',
    target_user_id,
    jsonb_build_object('previous_role', v_previous_role)
  );
end;
$$;

grant execute on function revoke_admin_access(uuid, uuid) to authenticated;


create or replace function suspend_user(
  target_user_id uuid,
  reason text,
  suspended_by_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_role text;
begin
  select role::text into v_caller_role
  from profiles where id = suspended_by_id;

  if v_caller_role not in ('super_admin', 'admin') then
    raise exception 'Only admins can suspend users';
  end if;

  update profiles
  set
    is_suspended = true,
    suspended_at = now(),
    suspension_reason = reason
  where id = target_user_id;

  update auth.users
  set banned_until = 'infinity'
  where id = target_user_id;

  insert into admin_audit_log (admin_id, action, target_type, target_id, details)
  values (
    suspended_by_id,
    'suspend_user',
    'user',
    target_user_id,
    jsonb_build_object('reason', reason)
  );
end;
$$;

grant execute on function suspend_user(uuid, text, uuid) to authenticated;


create or replace function unsuspend_user(
  target_user_id uuid,
  unsuspended_by_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_role text;
begin
  select role::text into v_caller_role
  from profiles where id = unsuspended_by_id;

  if v_caller_role not in ('super_admin', 'admin') then
    raise exception 'Only admins can unsuspend users';
  end if;

  update profiles
  set
    is_suspended = false,
    suspended_at = null,
    suspension_reason = null
  where id = target_user_id;

  update auth.users
  set banned_until = null
  where id = target_user_id;

  insert into admin_audit_log (admin_id, action, target_type, target_id, details)
  values (
    unsuspended_by_id,
    'unsuspend_user',
    'user',
    target_user_id,
    null
  );
end;
$$;

grant execute on function unsuspend_user(uuid, uuid) to authenticated;


create or replace function suspend_company(
  target_company_id uuid,
  reason text,
  suspended_by_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_role text;
begin
  select role::text into v_caller_role
  from profiles where id = suspended_by_id;

  if v_caller_role != 'super_admin' then
    raise exception 'Only super_admin can suspend a company';
  end if;

  update companies
  set is_suspended = true, suspended_at = now(), suspension_reason = reason
  where id = target_company_id;

  insert into admin_audit_log (admin_id, action, target_type, target_id, details)
  values (suspended_by_id, 'suspend_company', 'company', target_company_id, jsonb_build_object('reason', reason));
end;
$$;

grant execute on function suspend_company(uuid, text, uuid) to authenticated;


create or replace function unsuspend_company(
  target_company_id uuid,
  unsuspended_by_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_role text;
begin
  select role::text into v_caller_role
  from profiles where id = unsuspended_by_id;

  if v_caller_role != 'super_admin' then
    raise exception 'Only super_admin can unsuspend a company';
  end if;

  update companies
  set is_suspended = false, suspended_at = null, suspension_reason = null
  where id = target_company_id;

  insert into admin_audit_log (admin_id, action, target_type, target_id, details)
  values (unsuspended_by_id, 'unsuspend_company', 'company', target_company_id, null);
end;
$$;

grant execute on function unsuspend_company(uuid, uuid) to authenticated;


-- =================================================================
-- STEP 6 — Admin read RPCs
-- =================================================================

create or replace function get_admin_companies()
returns json
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(json_agg(row_to_json(c)), '[]'::json) from (
    select
      co.id,
      co.name as company_name,
      co.country,
      co.currency,
      co.is_suspended,
      co.suspended_at,
      co.suspension_reason,
      co.created_at,
      owner.full_name as owner_name,
      owner_auth.email as owner_email,
      coalesce(proj.projects_count, 0) as projects_count,
      coalesce(proj.active_projects_count, 0) as active_projects_count,
      coalesce(mem.users_count, 0) as users_count
    from companies co
    left join lateral (
      select cm.user_id
      from company_members cm
      where cm.company_id = co.id
      order by cm.joined_at asc
      limit 1
    ) first_member on true
    left join profiles owner on owner.id = first_member.user_id
    left join auth.users owner_auth on owner_auth.id = first_member.user_id
    left join lateral (
      select
        count(*) as projects_count,
        count(*) filter (where p.status = 'active') as active_projects_count
      from projects p where p.company_id = co.id
    ) proj on true
    left join lateral (
      select count(*) as users_count
      from company_members cm2 where cm2.company_id = co.id
    ) mem on true
    order by co.created_at desc
  ) c;
$$;

grant execute on function get_admin_companies() to authenticated;


create or replace function get_admin_users(
  p_search text default null,
  p_role text default null,
  p_status text default null,
  p_limit int default 50,
  p_offset int default 0
)
returns json
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_total int;
  v_users json;
begin
  select count(*) into v_total
  from profiles pr
  join auth.users au on au.id = pr.id
  where (p_search is null or p_search = '' or
    pr.full_name ilike '%' || p_search || '%' or au.email ilike '%' || p_search || '%')
  and (p_role is null or p_role = '' or pr.role::text = p_role)
  and (p_status is null or p_status = 'all' or
    (p_status = 'active' and not pr.is_suspended) or
    (p_status = 'suspended' and pr.is_suspended));

  select json_agg(row_to_json(u)) into v_users
  from (
    select
      pr.id,
      pr.full_name,
      au.email,
      pr.role::text as role,
      pr.is_suspended,
      pr.suspended_at,
      pr.suspension_reason,
      pr.created_at,
      au.last_sign_in_at,
      comp.company_name,
      coalesce(pm.projects_count, 0) as projects_count
    from profiles pr
    join auth.users au on au.id = pr.id
    left join lateral (
      select co.name as company_name
      from company_members cm join companies co on co.id = cm.company_id
      where cm.user_id = pr.id
      order by cm.joined_at asc
      limit 1
    ) comp on true
    left join lateral (
      select count(*) as projects_count
      from project_members pm2 where pm2.user_id = pr.id
    ) pm on true
    where (p_search is null or p_search = '' or
      pr.full_name ilike '%' || p_search || '%' or au.email ilike '%' || p_search || '%')
    and (p_role is null or p_role = '' or pr.role::text = p_role)
    and (p_status is null or p_status = 'all' or
      (p_status = 'active' and not pr.is_suspended) or
      (p_status = 'suspended' and pr.is_suspended))
    order by pr.created_at desc
    limit p_limit offset p_offset
  ) u;

  return json_build_object('users', coalesce(v_users, '[]'::json), 'total', v_total);
end;
$$;

grant execute on function get_admin_users(text, text, text, int, int) to authenticated;


create or replace function get_platform_stats(p_days int default 30)
returns json
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_result json;
begin
  select json_build_object(
    'new_companies', (select count(*) from companies where created_at >= now() - (p_days || ' days')::interval),
    'new_users', (select count(*) from profiles where created_at >= now() - (p_days || ' days')::interval),
    'new_projects', (select count(*) from projects where created_at >= now() - (p_days || ' days')::interval),
    'new_reports', (select count(*) from daily_reports where created_at >= now() - (p_days || ' days')::interval),

    'total_companies', (select count(*) from companies),
    'total_users', (select count(*) from profiles),
    'total_projects', (select count(*) from projects),
    'total_reports', (select count(*) from daily_reports),
    'total_boq_value', (select coalesce(sum(budgeted_total), 0) from boq_items),

    'signups_by_week', (
      select coalesce(json_agg(json_build_object(
        'week_label', to_char(week_start, 'Mon DD'),
        'count', signup_count
      ) order by week_start), '[]'::json)
      from (
        select date_trunc('week', created_at)::date as week_start, count(*) as signup_count
        from profiles
        where created_at >= now() - interval '12 weeks'
        group by 1
      ) w
    ),

    'role_distribution', (
      select coalesce(json_agg(json_build_object(
        'role', role::text,
        'count', role_count,
        'pct', round(role_count::numeric / greatest(total, 1) * 100, 1)
      ) order by role_count desc), '[]'::json)
      from (
        select role, count(*) as role_count, (select count(*) from profiles) as total
        from profiles
        group by role
      ) r
    ),

    'top_companies', (
      select coalesce(json_agg(row_to_json(tc)), '[]'::json) from (
        select
          co.name as company_name,
          coalesce(rc.reports_this_month, 0) as reports_this_month,
          coalesce(pc.active_projects, 0) as active_projects,
          coalesce(mc.members, 0) as members
        from companies co
        left join lateral (
          select count(*) as reports_this_month
          from daily_reports dr
          join projects p on p.id = dr.project_id
          where p.company_id = co.id and dr.created_at >= date_trunc('month', now())
        ) rc on true
        left join lateral (
          select count(*) as active_projects from projects p2
          where p2.company_id = co.id and p2.status = 'active'
        ) pc on true
        left join lateral (
          select count(*) as members from company_members cm where cm.company_id = co.id
        ) mc on true
        order by reports_this_month desc
        limit 5
      ) tc
    )
  ) into v_result;

  return v_result;
end;
$$;

grant execute on function get_platform_stats(int) to authenticated;


-- =================================================================
-- STEP 7 — RLS: give admins platform-wide visibility
-- Direct table queries used by the admin pages (projects list, team
-- tabs, reports tabs, BOQ tabs) otherwise fall under the normal
-- company/project-scoped policies and would return nothing.
-- =================================================================

drop policy if exists "Admins can view all profiles" on profiles;
create policy "Admins can view all profiles"
  on profiles for select
  using (is_platform_admin());

drop policy if exists "Super admin can update any profile" on profiles;
create policy "Super admin can update any profile"
  on profiles for update
  using (is_super_admin());

drop policy if exists "Admins can view all companies" on companies;
create policy "Admins can view all companies"
  on companies for select
  using (is_platform_admin());

drop policy if exists "Super admin can update companies" on companies;
create policy "Super admin can update companies"
  on companies for update
  using (is_super_admin());

drop policy if exists "Admins can view all company_members" on company_members;
create policy "Admins can view all company_members"
  on company_members for select
  using (is_platform_admin());

drop policy if exists "Super admin can manage company_members" on company_members;
create policy "Super admin can manage company_members"
  on company_members for delete
  using (is_super_admin());

drop policy if exists "Super admin can update company_members" on company_members;
create policy "Super admin can update company_members"
  on company_members for update
  using (is_super_admin());

drop policy if exists "Admins can view all projects" on projects;
create policy "Admins can view all projects"
  on projects for select
  using (is_platform_admin());

drop policy if exists "Super admin can update projects" on projects;
create policy "Super admin can update projects"
  on projects for update
  using (is_super_admin());

drop policy if exists "Admins can view all project_members" on project_members;
create policy "Admins can view all project_members"
  on project_members for select
  using (is_platform_admin());

drop policy if exists "Super admin can manage project_members" on project_members;
create policy "Super admin can manage project_members"
  on project_members for delete
  using (is_super_admin());

drop policy if exists "Super admin can update project_members" on project_members;
create policy "Super admin can update project_members"
  on project_members for update
  using (is_super_admin());

drop policy if exists "Admins can view all daily_reports" on daily_reports;
create policy "Admins can view all daily_reports"
  on daily_reports for select
  using (is_platform_admin());

drop policy if exists "Admins can view all boq_sections" on boq_sections;
create policy "Admins can view all boq_sections"
  on boq_sections for select
  using (is_platform_admin());

drop policy if exists "Super admin can update boq_sections" on boq_sections;
create policy "Super admin can update boq_sections"
  on boq_sections for update
  using (is_super_admin());

drop policy if exists "Admins can view all boq_items" on boq_items;
create policy "Admins can view all boq_items"
  on boq_items for select
  using (is_platform_admin());

drop policy if exists "Super admin can update boq_items" on boq_items;
create policy "Super admin can update boq_items"
  on boq_items for update
  using (is_super_admin());

drop policy if exists "Admins can view all notifications" on notifications;
create policy "Admins can view all notifications"
  on notifications for select
  using (is_platform_admin());

drop policy if exists "Admins can view audit log" on admin_audit_log;
create policy "Admins can view audit log"
  on admin_audit_log for select
  using (is_platform_admin());

-- Inserts into admin_audit_log only ever happen through the security
-- definer functions above (which run as the function owner and bypass
-- RLS), so no insert policy is needed for the authenticated role.


-- =================================================================
-- STEP 8 — Platform settings (singleton row)
-- =================================================================

create table if not exists platform_settings (
  id boolean primary key default true check (id),
  platform_name text not null default 'Construction Manager',
  support_email text,
  default_country text not null default 'Rwanda',
  default_currency text not null default 'RWF',
  maintenance_mode boolean not null default false,
  updated_at timestamptz default now() not null
);

comment on table platform_settings is 'Single-row table (id is always true) holding platform-wide settings.';

insert into platform_settings (id) values (true) on conflict (id) do nothing;

alter table platform_settings enable row level security;

drop policy if exists "Admins can view platform settings" on platform_settings;
create policy "Admins can view platform settings"
  on platform_settings for select
  using (is_platform_admin());

drop policy if exists "Super admin can update platform settings" on platform_settings;
create policy "Super admin can update platform settings"
  on platform_settings for update
  using (is_super_admin());
