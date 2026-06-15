-- Public read access for the owner-shareable dashboard (/share/[token]).
-- These policies allow the anon key to read project data when the project
-- has a share_token set (meaning the PM intentionally made it shareable).

-- Projects: readable if they have a share_token
create policy "Public can read shared projects"
  on projects for select
  using (share_token is not null);

-- Plan zones: readable for shared projects
create policy "Public can read zones of shared projects"
  on plan_zones for select
  using (
    project_id in (select id from projects where share_token is not null)
  );

-- Daily reports: readable for shared projects
create policy "Public can read reports of shared projects"
  on daily_reports for select
  using (
    project_id in (select id from projects where share_token is not null)
  );

-- Report photos: readable when parent report is on a shared project
create policy "Public can read photos of shared projects"
  on report_photos for select
  using (
    report_id in (
      select id from daily_reports
      where project_id in (select id from projects where share_token is not null)
    )
  );

-- BOQ sections: readable for shared projects
create policy "Public can read BOQ sections of shared projects"
  on boq_sections for select
  using (
    project_id in (select id from projects where share_token is not null)
  );

-- BOQ items: readable when parent section is on a shared project
create policy "Public can read BOQ items of shared projects"
  on boq_items for select
  using (
    section_id in (
      select id from boq_sections
      where project_id in (select id from projects where share_token is not null)
    )
  );

-- Tasks: readable for shared projects
create policy "Public can read tasks of shared projects"
  on tasks for select
  using (
    project_id in (select id from projects where share_token is not null)
  );
