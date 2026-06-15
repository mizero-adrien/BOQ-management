-- =================================================================
-- FIX INVITE ACCEPTANCE RLS
-- Run this in Supabase SQL Editor after the main schema.
-- =================================================================


-- FIX 1: project_members INSERT — invitees blocked by PM-only policy
--
-- The existing policy "PMs can add members to their projects" only lets
-- the project PM insert rows (pm_id = auth.uid()). When an invitee calls
-- handleAccept() they insert themselves — but they are not the PM, so
-- Supabase rejects with a permissions error, which the UI wrongly displays
-- as "You may already be a member of this project."
--
-- We add a security-definer helper to read auth.users (not accessible
-- from plain SQL) and a new policy that allows self-insert when a valid
-- unexpired invitation exists for that email + project.

create or replace function get_auth_email()
returns text
language sql
security definer
stable
as $$
  select email from auth.users where id = auth.uid();
$$;

grant execute on function get_auth_email() to authenticated;

drop policy if exists "Invitees can accept their own invitation" on project_members;

create policy "Invitees can accept their own invitation"
  on project_members for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from invitations
      where project_id = project_members.project_id
        and email = get_auth_email()
        and accepted = false
        and expires_at > now()
    )
  );


-- FIX 2: projects SELECT — project name is blank on the invite acceptance page
--
-- The "Users can view their projects" policy requires membership or PM status.
-- When an invitee visits /invite/[token] they are not yet a member, so the
-- projects query returns null and the page shows "You have been invited to join"
-- with no project name. A project name is not sensitive — anyone with the
-- invite link can see the token so we allow viewing via active invitation.

drop policy if exists "Users can view projects they are invited to" on projects;

create policy "Users can view projects they are invited to"
  on projects for select
  using (
    id in (
      select project_id from invitations
      where accepted = false
        and expires_at > now()
    )
  );


-- FIX 3: profiles SELECT — inviter name shows as "Someone"
--
-- The existing "Users can view their own profile" policy restricts SELECT to
-- auth.uid() = id, so the invite page cannot load the PM's full_name.
-- Within this app all authenticated users need to see team members' names
-- (task assignments, report authors, team lists, etc.).

drop policy if exists "Users can view their own profile" on profiles;

create policy "Authenticated users can view all profiles"
  on profiles for select
  using (auth.uid() is not null);
