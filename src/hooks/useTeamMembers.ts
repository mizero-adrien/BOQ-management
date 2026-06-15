'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface TeamMember {
  userId: string
  fullName: string
  role: string
  projectId: string
}

export function useTeamMembers(projectId: string) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    const supabase = createClient()

    const { data: pm } = await supabase
      .from('project_members')
      .select('user_id, role')
      .eq('project_id', projectId)

    if (!pm || pm.length === 0) {
      setMembers([])
      setLoading(false)
      return
    }

    const userIds = pm.map((m) => m.user_id as string)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds)

    const nameMap = new Map(
      (profiles ?? []).map((p) => [p.id as string, p.full_name as string])
    )

    setMembers(
      pm.map((m) => ({
        userId: m.user_id as string,
        fullName: nameMap.get(m.user_id as string) ?? 'Unknown',
        role: m.role as string,
        projectId,
      }))
    )
    setLoading(false)
  }, [projectId])

  useEffect(() => { load() }, [load])

  async function removeMember(userId: string) {
    const supabase = createClient()
    await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId)
    setMembers((prev) => prev.filter((m) => m.userId !== userId))
  }

  async function changeRole(userId: string, newRole: string) {
    const supabase = createClient()
    await Promise.all([
      supabase
        .from('project_members')
        .update({ role: newRole })
        .eq('project_id', projectId)
        .eq('user_id', userId),
      supabase.rpc('update_user_role', { target_user_id: userId, new_role: newRole }),
    ])
    setMembers((prev) =>
      prev.map((m) => (m.userId === userId ? { ...m, role: newRole } : m))
    )
  }

  return { members, loading, removeMember, changeRole }
}
