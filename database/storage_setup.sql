-- Storage policies for the report-photos bucket.
--
-- BEFORE running this file, create the bucket in the Supabase dashboard:
--   Storage > New bucket
--   Name: report-photos
--   Public bucket: ON  (required — the app uses getPublicUrl which needs a public bucket)
--
-- Then run this SQL in the Supabase SQL editor to allow engineers to upload.

-- Allow any authenticated user to upload to the report-photos bucket.
-- The daily_reports RLS already ensures engineers can only attach photos
-- to their own reports (enforced in useSubmitReport).
create policy "Authenticated users can upload report photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'report-photos');

-- Allow authenticated users to update/replace their uploads.
create policy "Authenticated users can update report photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'report-photos');

-- Allow authenticated users to delete their uploads.
create policy "Authenticated users can delete report photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'report-photos');

-- Public read is automatic for a public bucket.
-- If the bucket was created as private, add this policy to allow reads:
--
-- create policy "Public read access for report photos"
--   on storage.objects for select
--   using (bucket_id = 'report-photos');
