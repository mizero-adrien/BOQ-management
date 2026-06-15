-- Search users by name or email, excluding the current user.
-- Called via supabase.rpc('search_users', { search_term: '...' })

CREATE OR REPLACE FUNCTION search_users(search_term text)
RETURNS TABLE (
  id uuid,
  full_name text,
  role text,
  email text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.full_name,
    p.role::text,
    u.email
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE (
    p.full_name ILIKE '%' || search_term || '%'
    OR u.email ILIKE '%' || search_term || '%'
  )
  AND p.id != auth.uid()
  ORDER BY p.full_name
  LIMIT 20;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION search_users(text) TO authenticated;
