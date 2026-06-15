-- Update the handle_new_user trigger to set default role as pm
-- Role will be updated when the user joins a project via invitation

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    'pm'
  );
  return new;
end;
$$;
