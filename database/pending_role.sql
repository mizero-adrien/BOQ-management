-- Add 'pending' as a valid role if not already in the enum.
--
-- profiles.role, project_members.role and company_members.role are all
-- typed as the user_role enum. A brand-new user who accepts an invite
-- before an explicit role is assigned is meant to sit in a 'pending'
-- state (see project_switching.sql's update_user_role and
-- fix_role_sync.sql), but 'pending' was never actually added to the
-- enum, so any comparison against the literal 'pending' fails with:
--   invalid input value for enum user_role: "pending"
-- This breaks update_user_role() for every call, not just pending users,
-- because the enum cast is evaluated unconditionally.
do $$
begin
  if not exists (
    select 1 from pg_enum
    where enumlabel = 'pending'
    and enumtypid = (select oid from pg_type where typname = 'user_role')
  ) then
    alter type user_role add value 'pending';
  end if;
end$$;
