import { verifyAdmin } from '@/lib/admin/verifyAdmin'
import { createServiceRoleClient } from '@/lib/supabase/adminClient'

export async function DELETE(request: Request) {
  const check = await verifyAdmin(true)
  if (!check.ok) return Response.json({ error: check.error }, { status: check.status })

  let userId: string
  try {
    const body = await request.json() as { userId?: string }
    userId = body.userId ?? ''
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if (!userId) return Response.json({ error: 'Missing userId' }, { status: 400 })

  if (userId === check.user!.id) {
    return Response.json({ error: 'You cannot delete your own account' }, { status: 400 })
  }

  const adminClient = createServiceRoleClient()
  if (!adminClient) return Response.json({ error: 'Service role key is not configured on this server' }, { status: 503 })

  const { data: profile } = await adminClient
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .single()

  await adminClient.from('admin_audit_log').insert({
    admin_id: check.user!.id,
    action: 'delete_user',
    target_type: 'user',
    target_id: userId,
    details: { full_name: profile?.full_name ?? null },
  })

  // profiles row cascades from auth.users on delete
  const { error } = await adminClient.auth.admin.deleteUser(userId)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ success: true })
}
