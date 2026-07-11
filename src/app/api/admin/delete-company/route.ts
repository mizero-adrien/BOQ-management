import { verifyAdmin } from '@/lib/admin/verifyAdmin'
import { createServiceRoleClient } from '@/lib/supabase/adminClient'

export async function DELETE(request: Request) {
  const check = await verifyAdmin(true)
  if (!check.ok) return Response.json({ error: check.error }, { status: check.status })

  let companyId: string
  try {
    const body = await request.json() as { companyId?: string }
    companyId = body.companyId ?? ''
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if (!companyId) return Response.json({ error: 'Missing companyId' }, { status: 400 })

  const adminClient = createServiceRoleClient()
  if (!adminClient) return Response.json({ error: 'Service role key is not configured on this server' }, { status: 503 })

  const { data: company } = await adminClient
    .from('companies')
    .select('name')
    .eq('id', companyId)
    .single()

  await adminClient.from('admin_audit_log').insert({
    admin_id: check.user!.id,
    action: 'delete_company',
    target_type: 'company',
    target_id: companyId,
    details: { company_name: company?.name ?? null },
  })

  const { error } = await adminClient.from('companies').delete().eq('id', companyId)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ success: true })
}
