import { createClient } from '@supabase/supabase-js'

/** Service-role client for privileged admin operations. Returns null if the
 * SUPABASE_SERVICE_ROLE_KEY env var hasn't been configured yet. */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
