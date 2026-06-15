-- Demo seed function
-- Creates a complete demo project with real BOQ data for a given PM user.
-- Run add_is_demo.sql first, then this file.
-- Based on: Proposed Refurbishment of Commercial House, Gataraga Sector, Musanze District

create or replace function create_demo_project(pm_user_id uuid, company_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project_id   uuid;
  v_section_1_id uuid;
  v_section_2_id uuid;
  v_section_3_id uuid;
  v_section_4_id uuid;
  v_section_5_id uuid;
  v_section_6_id uuid;
  v_zone_ground  uuid;
  v_zone_demo    uuid;
begin

  -- Safety: caller must be the target user
  if pm_user_id != auth.uid() then
    raise exception 'Unauthorized: pm_user_id must match the calling user';
  end if;

  -- =============================================
  -- PROJECT
  -- =============================================
  insert into projects (
    company_id, pm_id, name, location, client_name,
    status, start_date, expected_end_date, overall_progress, is_demo
  ) values (
    company_id, pm_user_id,
    'Proposed Refurbishment of Commercial House',
    'Gataraga Sector, Musanze District',
    'Demo Client',
    'active', '2026-03-01', '2026-09-30', 24, true
  )
  returning id into v_project_id;

  -- Add PM to project_members
  insert into project_members (project_id, user_id, role)
  values (v_project_id, pm_user_id, 'pm');

  -- =============================================
  -- PLAN ZONES
  -- =============================================
  insert into plan_zones (project_id, name, x_pct, y_pct, width_pct, height_pct, color, status, progress_pct, order_index)
  values (v_project_id, 'Demolition area', 5, 5, 42, 42, '#778EDE', 'done', 100, 1)
  returning id into v_zone_demo;

  insert into plan_zones (project_id, name, x_pct, y_pct, width_pct, height_pct, color, status, progress_pct, order_index)
  values (v_project_id, 'Ground floor', 52, 5, 43, 42, '#778EDE', 'in_progress', 45, 2)
  returning id into v_zone_ground;

  insert into plan_zones (project_id, name, x_pct, y_pct, width_pct, height_pct, color, status, progress_pct, order_index)
  values (v_project_id, 'First floor', 5, 52, 42, 43, '#778EDE', 'not_started', 0, 3);

  insert into plan_zones (project_id, name, x_pct, y_pct, width_pct, height_pct, color, status, progress_pct, order_index)
  values (v_project_id, 'External cladding', 52, 52, 43, 43, '#778EDE', 'not_started', 0, 4);

  -- =============================================
  -- SECTION 1: DEMOLITION WORKS  (sub-total 420,000 RWF)
  -- =============================================
  insert into boq_sections (project_id, title, order_index, status)
  values (v_project_id, 'Demolition Works', 1, 'done')
  returning id into v_section_1_id;

  insert into boq_items (section_id, description, unit, quantity, unit_rate, used_quantity, used_total, status, order_index) values
    (v_section_1_id, 'Roof demolition - Mason Labour',             'Days', 7,  8000, 7,  56000,  'done', 1),
    (v_section_1_id, 'Roof demolition - Helper Labour',            'Days', 21, 4000, 21, 84000,  'done', 2),
    (v_section_1_id, 'Walling demolition - Mason Labour',          'Days', 14, 8000, 14, 112000, 'done', 3),
    (v_section_1_id, 'Walling demolition - Helper Labour',         'Days', 28, 4000, 28, 112000, 'done', 4),
    (v_section_1_id, 'Site clearing - Helper Labour',              'Days', 14, 4000, 14, 56000,  'done', 5);

  -- =============================================
  -- SECTION 2: BLOCK MASONRY (sub-total 797,770 RWF)
  -- =============================================
  insert into boq_sections (project_id, title, order_index, status)
  values (v_project_id, 'Block Masonry (Rukarakara)', 2, 'in_progress')
  returning id into v_section_2_id;

  insert into boq_items (section_id, description, unit, quantity, unit_rate, used_quantity, used_total, status, order_index) values
    (v_section_2_id, 'Blocks and transport (400x200x20mm)', 'Nrs',    1475.46, 150,    1000,  150000, 'in_progress', 1),
    (v_section_2_id, 'Cement',                              'Bags',   6,       16000,  4,     64000,  'in_progress', 2),
    (v_section_2_id, 'Sand',                                'Trucks', 0.4,     180000, 0.2,   36000,  'in_progress', 3),
    (v_section_2_id, 'Water',                               'CUM',    0.1,     12500,  0,     0,      'not_started', 4),
    (v_section_2_id, 'Builder Labour',                      'Days',   21,      10000,  10,    100000, 'in_progress', 5),
    (v_section_2_id, 'Helper Labour',                       'Days',   42,      5000,   18,    90000,  'in_progress', 6);

  -- =============================================
  -- SECTION 3: WALL PLASTERING (sub-total 1,194,417 RWF)
  -- =============================================
  insert into boq_sections (project_id, title, order_index, status)
  values (v_project_id, 'Wall Plastering', 3, 'not_started')
  returning id into v_section_3_id;

  insert into boq_items (section_id, description, unit, quantity, unit_rate, used_quantity, used_total, status, order_index) values
    (v_section_3_id, 'Cement',        'Bags', 24.37, 16000,  0, 0, 'not_started', 1),
    (v_section_3_id, 'Sand',          'CUM',  0.97,  180000, 0, 0, 'not_started', 2),
    (v_section_3_id, 'Water',         'CUM',  0.19,  12500,  0, 0, 'not_started', 3),
    (v_section_3_id, 'Mason Labour',  'Days', 35,    8000,   0, 0, 'not_started', 4),
    (v_section_3_id, 'Porter Labour', 'Days', 70,    5000,   0, 0, 'not_started', 5);

  -- =============================================
  -- SECTION 4: WALL PAINTING AND FLOORING TILES (sub-total 1,817,626 RWF)
  -- =============================================
  insert into boq_sections (project_id, title, order_index, status)
  values (v_project_id, 'Wall Painting and Flooring Tiles', 4, 'not_started')
  returning id into v_section_4_id;

  insert into boq_items (section_id, description, unit, quantity, unit_rate, used_quantity, used_total, status, order_index) values
    (v_section_4_id, 'Enduit',                        'Jerrican',   10,   20000,  0, 0, 'not_started', 1),
    (v_section_4_id, 'Colle a bois',                  'Bucket 4kg', 5,    11000,  0, 0, 'not_started', 2),
    (v_section_4_id, 'Sanding paper Indasa 220',       'PCS',        4,    1200,   0, 0, 'not_started', 3),
    (v_section_4_id, 'Sanding paper Indasa 120',       'PCS',        4,    1200,   0, 0, 'not_started', 4),
    (v_section_4_id, 'Paint roller',                   'PCS',        4,    1500,   0, 0, 'not_started', 5),
    (v_section_4_id, 'Paint brush',                    'PCS',        10,   1200,   0, 0, 'not_started', 6),
    (v_section_4_id, 'Imvaho',                         'KG',         15,   3000,   0, 0, 'not_started', 7),
    (v_section_4_id, 'Worker Labour',                  'Days',       3,    15000,  0, 0, 'not_started', 8),
    (v_section_4_id, 'Flooring tiles (500x500x8mm)',   'SQM',        64,   12000,  0, 0, 'not_started', 9),
    (v_section_4_id, 'Cement for tiles',               'Bags',       6,    13200,  0, 0, 'not_started', 10),
    (v_section_4_id, 'Sand for tiles',                 'Trucks',     2,    180000, 0, 0, 'not_started', 11),
    (v_section_4_id, 'White cement (ciment blanc)',    'Bags',       4,    13500,  0, 0, 'not_started', 12),
    (v_section_4_id, 'Tile builder labour',            'Days',       7,    9000,   0, 0, 'not_started', 13),
    (v_section_4_id, 'Tile helper labour',             'Days',       7,    4000,   0, 0, 'not_started', 14);

  -- =============================================
  -- SECTION 5: STONE CLADDING AND EXTERNAL (sub-total 1,625,052 RWF)
  -- =============================================
  insert into boq_sections (project_id, title, order_index, status)
  values (v_project_id, 'Stone Cladding and External Finishing', 5, 'not_started')
  returning id into v_section_5_id;

  insert into boq_items (section_id, description, unit, quantity, unit_rate, used_quantity, used_total, status, order_index) values
    (v_section_5_id, 'Brick cladding',                       'Nrs',  5416.7, 70,    0, 0, 'not_started', 1),
    (v_section_5_id, 'Cement for brick cladding',            'Bags', 20.6,   12500, 0, 0, 'not_started', 2),
    (v_section_5_id, 'Sand for brick cladding',              'CM',   1.4,    37500, 0, 0, 'not_started', 3),
    (v_section_5_id, 'Builder labour for brick cladding',    'Days', 18.1,   9000,  0, 0, 'not_started', 4),
    (v_section_5_id, 'Helper labour for brick cladding',     'Days', 36.1,   4000,  0, 0, 'not_started', 5),
    (v_section_5_id, 'Stone cladding Amakoro',               'SM',   20,     12000, 0, 0, 'not_started', 6),
    (v_section_5_id, 'Cement for stone cladding',            'Bags', 6.3,    12500, 0, 0, 'not_started', 7),
    (v_section_5_id, 'Sand for stone cladding',              'CM',   0.4,    37500, 0, 0, 'not_started', 8),
    (v_section_5_id, 'Builder labour for stone cladding',    'Days', 6.7,    9000,  0, 0, 'not_started', 9),
    (v_section_5_id, 'Helper labour for stone cladding',     'Days', 58,     4000,  0, 0, 'not_started', 10);

  -- =============================================
  -- SECTION 6: OPENINGS, MEP AND EXTERNAL (sub-total 2,402,041 RWF)
  -- =============================================
  insert into boq_sections (project_id, title, order_index, status)
  values (v_project_id, 'Openings, MEP and External Works', 6, 'not_started')
  returning id into v_section_6_id;

  insert into boq_items (section_id, description, unit, quantity, unit_rate, used_quantity, used_total, status, order_index) values
    (v_section_6_id, 'Door (2.10 x 0.90)',                   'Nrs', 5, 140000, 0, 0, 'not_started', 1),
    (v_section_6_id, 'Door (2.40 x 2.70)',                   'Nrs', 3, 250000, 0, 0, 'not_started', 2),
    (v_section_6_id, 'Window',                               'Nrs', 2, 120000, 0, 0, 'not_started', 3),
    (v_section_6_id, 'MEP works (4 percent of sub-total)',   'LS',  1, 284816, 0, 0, 'not_started', 4),
    (v_section_6_id, 'External works (6 percent of sub-total)', 'LS', 1, 427225, 0, 0, 'not_started', 5);

  -- =============================================
  -- DEMO DAILY REPORTS
  -- =============================================
  insert into daily_reports (
    project_id, engineer_id, zone_id, report_date,
    workers_count, progress_pct, notes, issues, weather, status, submitted_at
  ) values (
    v_project_id, pm_user_id, v_zone_ground,
    current_date - 1,
    14, 45,
    'Continued block masonry on ground floor east wing. Completed courses 4 through 6.',
    'Cement delivery arrived 2 hours late. Work resumed at 10am.',
    'sunny', 'submitted',
    now() - interval '1 day' + interval '16 hours'
  );

  insert into daily_reports (
    project_id, engineer_id, zone_id, report_date,
    workers_count, progress_pct, notes, issues, weather, status, submitted_at
  ) values (
    v_project_id, pm_user_id, v_zone_ground,
    current_date - 2,
    12, 38,
    'Block masonry ground floor. Completed window opening frames on north wall.',
    null,
    'cloudy', 'submitted',
    now() - interval '2 days' + interval '16 hours'
  );

  insert into daily_reports (
    project_id, engineer_id, zone_id, report_date,
    workers_count, progress_pct, notes, issues, weather, status, submitted_at
  ) values (
    v_project_id, pm_user_id, v_zone_demo,
    current_date - 5,
    18, 100,
    'Demolition complete. Site cleared and ready for masonry.',
    null,
    'sunny', 'submitted',
    now() - interval '5 days' + interval '16 hours'
  );

  -- =============================================
  -- DEMO TASKS
  -- =============================================
  insert into tasks (project_id, assigned_to, created_by, title, description, due_date, status) values
    (v_project_id, pm_user_id, pm_user_id,
     'Complete block masonry east wing',
     'Finish courses 7 through 12 on the east wing ground floor',
     current_date + 3, 'in_progress'),
    (v_project_id, pm_user_id, pm_user_id,
     'Inspect rebar placement level 1',
     'Check all rebar is correctly placed before concrete pour',
     current_date + 1, 'not_started'),
    (v_project_id, pm_user_id, pm_user_id,
     'Order wall plastering materials',
     'Order cement bags and sand for plastering section. See BOQ section 3 for quantities.',
     current_date + 7, 'not_started'),
    (v_project_id, pm_user_id, pm_user_id,
     'Safety check walkthrough',
     'Weekly site safety inspection',
     current_date, 'not_started'),
    (v_project_id, pm_user_id, pm_user_id,
     'Submit weekly progress report to client',
     'Prepare and send progress update to client',
     current_date + 2, 'not_started');

  -- =============================================
  -- DEMO NOTIFICATIONS
  -- =============================================
  insert into notifications (user_id, project_id, type, title, body, read) values
    (pm_user_id, v_project_id,
     'report_submitted',
     'Site report pre-loaded',
     'Yesterday and the day before site reports have been pre-loaded as demo data so your dashboard feels alive.',
     true),
    (pm_user_id, v_project_id,
     'budget_alert',
     'Cement budget at 80 percent',
     'Cement in Block Masonry section has reached 80 percent of its budget. Consider ordering more.',
     false),
    (pm_user_id, v_project_id,
     'task_assigned',
     '5 demo tasks created',
     'Demo tasks have been added to help you explore the schedule and task features.',
     true);

  return v_project_id;

end;
$$;

grant execute on function create_demo_project(uuid, uuid) to authenticated;
