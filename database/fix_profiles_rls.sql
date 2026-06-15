-- Allow users to insert their own profile row.
-- Required because the handle_new_user trigger may not have completed
-- by the time the onboarding page tries to write to company_members,
-- which has a FK that references profiles(id).

drop policy if exists "Users can insert their own profile" on profiles;

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Ensure authenticated users have full access to the public schema
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on public.profiles to postgres, anon, authenticated, service_role;
