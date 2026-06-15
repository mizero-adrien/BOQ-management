-- View current inconsistencies between profiles.role and project_members.role.
-- Run the SELECT first to review before running the UPDATE.

select
  p.id,
  p.full_name,
  p.role as profile_role,
  pm.role as project_role,
  proj.name as project_name
from profiles p
join project_members pm on pm.user_id = p.id
join projects proj on proj.id = pm.project_id
where p.role != pm.role
  and p.role != 'pm'
order by p.full_name;

-- Fix: update profile role to match their project_members role.
-- Only applies to users with role = 'pending' on an active project.
-- Comment this out and run the SELECT above first to review.

update profiles p
set role = pm.role
from project_members pm
join projects proj on proj.id = pm.project_id
where pm.user_id = p.id
  and p.role = 'pending'
  and proj.status = 'active';
