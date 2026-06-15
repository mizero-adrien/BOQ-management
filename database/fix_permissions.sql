-- Fix permission denied errors for security definer functions
-- Grant execute permissions to authenticated and anon roles

grant execute on function is_project_member(uuid) to authenticated;
grant execute on function is_project_member(uuid) to anon;

grant execute on function is_project_pm(uuid) to authenticated;
grant execute on function is_project_pm(uuid) to anon;

grant execute on function get_user_project_ids() to authenticated;
grant execute on function get_user_project_ids() to anon;

grant execute on function create_company_with_member(text, text, text) to authenticated;

-- Also grant select on project_members to authenticated role directly
-- The security definer function needs this to bypass RLS internally
grant select on project_members to authenticated;
grant select on projects to authenticated;
grant select on boq_sections to authenticated;
grant select on boq_items to authenticated;
grant select on daily_reports to authenticated;
grant select on report_photos to authenticated;
grant select on plan_zones to authenticated;
grant select on tasks to authenticated;
grant select on material_logs to authenticated;
grant select on profiles to authenticated;
grant select on companies to authenticated;
grant select on company_members to authenticated;
grant select on notifications to authenticated;
grant select on plan_zones to authenticated;

-- Grant insert and update permissions
grant insert on daily_reports to authenticated;
grant update on daily_reports to authenticated;
grant insert on report_photos to authenticated;
grant insert on material_logs to authenticated;
grant update on material_logs to authenticated;
grant insert on companies to authenticated;
grant insert on company_members to authenticated;
grant insert on project_members to authenticated;
grant delete on project_members to authenticated;
grant insert on projects to authenticated;
grant update on projects to authenticated;
grant update on profiles to authenticated;
grant update on notifications to authenticated;
grant update on tasks to authenticated;
grant all on boq_sections to authenticated;
grant all on boq_items to authenticated;
grant all on plan_zones to authenticated;
grant all on tasks to authenticated;
