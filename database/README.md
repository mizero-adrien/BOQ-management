# Database Setup

## How to run the schema

1. Go to your Supabase project dashboard
2. Click SQL Editor in the left sidebar
3. Paste the entire contents of schema.sql
4. Click Run
5. Confirm all tables were created with no errors

## Tables created

- profiles (13 columns)
- companies (6 columns)
- company_members (5 columns)
- projects (14 columns)
- project_members (5 columns)
- plan_zones (12 columns)
- tasks (11 columns)
- daily_reports (14 columns)
- report_photos (6 columns)
- boq_sections (7 columns)
- boq_items (11 columns)
- material_logs (7 columns)
- notifications (9 columns)

## Key design decisions

- budgeted_total on boq_items is a generated column (quantity x unit_rate computed automatically)
- material_logs inserts trigger automatic updates to boq_items used_total via database trigger
- daily_reports submission triggers automatic zone progress updates
- zone progress updates trigger automatic project overall_progress recalculation
- share_token on projects is a UUID used for the public owner dashboard link with no login
- All coordinate values on plan_zones are stored as percentages so they scale on any screen size
- unique constraint on daily_reports prevents an engineer submitting twice for the same day

## Storage buckets to create manually

In Supabase dashboard go to Storage and create:
- report-photos (public read, authenticated write)
- plan-images (public read, authenticated write)

## Realtime enabled on

- notifications
- daily_reports
- tasks
- plan_zones
- boq_items

## RLS Fix -- run if you see infinite recursion error

If you see the error "infinite recursion detected in policy for relation project_members" run the file `database/fix_rls.sql` in the Supabase SQL Editor. This replaces the recursive policies with security definer functions that break the recursion cycle.
