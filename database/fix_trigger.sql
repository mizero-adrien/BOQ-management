-- Make the handle_new_user trigger idempotent.
-- ON CONFLICT DO NOTHING prevents duplicate key errors if the function
-- is called more than once for the same auth.users row (e.g. during retries).

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
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'engineer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
