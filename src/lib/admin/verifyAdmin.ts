import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

interface VerifyAdminResult {
  ok: boolean
  status: number
  error: string | null
  user: User | null
  role: string | null
}

/** Confirms the caller is authenticated and holds admin/super_admin.
 * Pass requireSuperAdmin to restrict to super_admin only. */
export async function verifyAdmin(requireSuperAdmin = false): Promise<VerifyAdminResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, status: 401, error: 'Unauthorized', user: null, role: null }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = (profile?.role as string) ?? null
  const allowed = requireSuperAdmin ? role === 'super_admin' : role === 'admin' || role === 'super_admin'

  if (!allowed) {
    return { ok: false, status: 403, error: 'Forbidden', user: null, role: null }
  }

  return { ok: true, status: 200, error: null, user, role }
}
