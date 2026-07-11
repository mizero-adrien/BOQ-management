import { verifyAdmin } from '@/lib/admin/verifyAdmin'
import { createServiceRoleClient } from '@/lib/supabase/adminClient'

export async function DELETE(request: Request) {
  const check = await verifyAdmin(true)
  if (!check.ok) return Response.json({ error: check.error }, { status: check.status })

  let projectId: string
  try {
    const body = await request.json() as { projectId?: string }
    projectId = body.projectId ?? ''
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if (!projectId) return Response.json({ error: 'Missing projectId' }, { status: 400 })

  const adminClient = createServiceRoleClient()
  if (!adminClient) return Response.json({ error: 'Service role key is not configured on this server' }, { status: 503 })

  const { data: project } = await adminClient
    .from('projects')
    .select('name')
    .eq('id', projectId)
    .single()

  await adminClient.from('admin_audit_log').insert({
    admin_id: check.user!.id,
    action: 'delete_project',
    target_type: 'project',
    target_id: projectId,
    details: { project_name: project?.name ?? null },
  })

  const { error } = await adminClient.from('projects').delete().eq('id', projectId)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ success: true })
}
