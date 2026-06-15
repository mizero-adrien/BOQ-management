-- Update a user's role in profiles and their auth metadata.
-- Called via supabase.rpc('update_user_role', { target_user_id: '...', new_role: '...' })
--
-- Drop the old text-parameter signature before recreating with user_role type.
drop function if exists update_user_role(uuid, text);

create or replace function update_user_role(target_user_id uuid, new_role user_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set role = new_role,
      updated_at = now()
  where id = target_user_id;

  -- Sync auth metadata so proxy routing and JWT claims stay consistent.
  update auth.users
  set raw_user_meta_data = raw_user_meta_data ||
    jsonb_build_object(
      'role', new_role::text,
      'has_company', true
    )
  where id = target_user_id;
end;
$$;

grant execute on function update_user_role(uuid, user_role) to authenticated;
