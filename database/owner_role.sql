-- Add owner as a valid role if not already in the enum
do $$
begin
  if not exists (
    select 1 from pg_enum
    where enumlabel = 'owner'
    and enumtypid = (select oid from pg_type where typname = 'user_role')
  ) then
    alter type user_role add value 'owner';
  end if;
end$$;
