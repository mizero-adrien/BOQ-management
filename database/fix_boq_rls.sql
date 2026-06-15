-- Fix BOQ RLS policies so PMs can read and manage their own project sections and items.
-- Run this in the Supabase SQL editor.

-- Diagnostic queries — run these first to verify data exists and is accessible:
--
-- select id, project_id, title, order_index from boq_sections limit 10;
-- select id, name, pm_id from projects limit 10;
-- select bs.title, bs.project_id, p.name, p.pm_id
--   from boq_sections bs
--   join projects p on p.id = bs.project_id
--   limit 10;


-- =============================================================
-- BOQ SECTIONS
-- =============================================================

drop policy if exists "Project members can view BOQ sections" on boq_sections;
drop policy if exists "PMs and QS can manage BOQ sections" on boq_sections;
drop policy if exists "PMs can manage BOQ sections" on boq_sections;
drop policy if exists "Users can view BOQ sections for their projects" on boq_sections;
drop policy if exists "PMs can insert BOQ sections" on boq_sections;
drop policy if exists "PMs can update BOQ sections" on boq_sections;
drop policy if exists "PMs can delete BOQ sections" on boq_sections;

-- Single SELECT policy: covers PMs (via pm_id) and project members (via get_user_project_ids)
create policy "Users can view BOQ sections for their projects"
  on boq_sections for select
  using (
    project_id in (select get_user_project_ids())
    or project_id in (select id from projects where pm_id = auth.uid())
  );

create policy "PMs can insert BOQ sections"
  on boq_sections for insert
  with check (
    project_id in (select id from projects where pm_id = auth.uid())
  );

create policy "PMs can update BOQ sections"
  on boq_sections for update
  using (
    project_id in (select id from projects where pm_id = auth.uid())
  );

create policy "PMs can delete BOQ sections"
  on boq_sections for delete
  using (
    project_id in (select id from projects where pm_id = auth.uid())
  );


-- =============================================================
-- BOQ ITEMS
-- =============================================================

drop policy if exists "Project members can view BOQ items" on boq_items;
drop policy if exists "PMs and QS can manage BOQ items" on boq_items;
drop policy if exists "PMs can manage BOQ items" on boq_items;
drop policy if exists "Users can view BOQ items for their projects" on boq_items;
drop policy if exists "PMs can insert BOQ items" on boq_items;
drop policy if exists "PMs can update BOQ items" on boq_items;
drop policy if exists "PMs can delete BOQ items" on boq_items;

-- Single SELECT policy: covers PMs and project members for items in their sections
create policy "Users can view BOQ items for their projects"
  on boq_items for select
  using (
    section_id in (
      select id from boq_sections
      where project_id in (select get_user_project_ids())
         or project_id in (select id from projects where pm_id = auth.uid())
    )
  );

create policy "PMs can insert BOQ items"
  on boq_items for insert
  with check (
    section_id in (
      select id from boq_sections
      where project_id in (select id from projects where pm_id = auth.uid())
    )
  );

create policy "PMs can update BOQ items"
  on boq_items for update
  using (
    section_id in (
      select id from boq_sections
      where project_id in (select id from projects where pm_id = auth.uid())
    )
  );

create policy "PMs can delete BOQ items"
  on boq_items for delete
  using (
    section_id in (
      select id from boq_sections
      where project_id in (select id from projects where pm_id = auth.uid())
    )
  );


-- =============================================================
-- GRANTS (ensure the authenticated role has table-level access)
-- =============================================================

grant select, insert, update, delete on boq_sections to authenticated;
grant select, insert, update, delete on boq_items to authenticated;

grant execute on function get_user_project_ids() to authenticated;
grant execute on function is_project_pm(uuid) to authenticated;
