import { verifyAdmin } from '@/lib/admin/verifyAdmin'
import { createServiceRoleClient } from '@/lib/supabase/adminClient'

export async function POST(request: Request) {
  const check = await verifyAdmin(false)
  if (!check.ok) return Response.json({ error: check.error }, { status: check.status })

  let email: string
  try {
    const body = await request.json() as { email?: string }
    email = body.email ?? ''
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if (!email) return Response.json({ error: 'Missing email' }, { status: 400 })

  const adminClient = createServiceRoleClient()
  if (!adminClient) return Response.json({ error: 'Service role key is not configured on this server' }, { status: 503 })

  const { error } = await adminClient.auth.admin.generateLink({ type: 'recovery', email })
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ success: true })
}
