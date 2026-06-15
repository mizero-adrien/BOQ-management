import { createClient } from '@/lib/supabase/client'

export async function createDemoProject(
  pmUserId: string,
  companyId: string
): Promise<{ projectId: string | null; error: string | null }> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('create_demo_project', {
    pm_user_id: pmUserId,
    company_id: companyId,
  })

  if (error) {
    console.error('Demo project creation error:', error.message)
    return { projectId: null, error: error.message }
  }

  return { projectId: data as string, error: null }
}
