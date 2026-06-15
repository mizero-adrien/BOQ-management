-- Test data for development
-- Run this after schema.sql only in development

-- Note: You must create the auth users manually in Supabase dashboard first
-- Then replace the UUIDs below with real auth user IDs

-- Insert a test company via security definer function (bypasses RLS for seed data)
create or replace function seed_company()
returns void
language plpgsql
security definer
as $$
begin
  insert into companies (id, name, country, currency)
  values ('00000000-0000-0000-0000-000000000001', 'Kigali Build Co', 'Rwanda', 'RWF');
end;
$$;

select seed_company();

drop function if exists seed_company();

-- Insert a test project
insert into projects (
  id, company_id, pm_id, name, location, client_name,
  start_date, expected_end_date, status
)
values (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  auth.uid(),
  'Musanze Refurbishment',
  'Gataraga Sector, Musanze District',
  'Client Name Here',
  '2026-03-01',
  '2026-09-30',
  'active'
);

-- Insert BOQ sections from the real Musanze project
insert into boq_sections (project_id, title, order_index) values
  ('00000000-0000-0000-0000-000000000002', 'Demolition works', 1),
  ('00000000-0000-0000-0000-000000000002', 'Block masonry (Rukarakara)', 2),
  ('00000000-0000-0000-0000-000000000002', 'Wall painting + flooring tiles', 3),
  ('00000000-0000-0000-0000-000000000002', 'Stone cladding + openings', 4);
