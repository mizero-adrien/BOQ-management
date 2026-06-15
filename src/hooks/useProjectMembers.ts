'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface ProjectMember {
  userId: string
  fullName: string
  role: string
  avatarUrl: string | null
}

export function useProjectMembers(projectId: string | undefined) {
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) {
      setLoading(false)
      return
    }

    let cancelled = false
    const timeout = setTimeout(() => {
      if (!cancelled) setLoading(false)
    }, 8000)

    async function fetchMembers() {
      const supabase = createClient()
      try {
        const { data: pm } = await supabase
          .from('project_members')
          .select('user_id, role')
          .eq('project_id', projectId)

        if (!pm || cancelled) return

        const userIds = pm.map((m) => m.user_id as string)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds)

        if (!cancelled) {
          const pMap = new Map(
            (profiles ?? []).map((p) => [
              p.id as string,
              { fullName: p.full_name as string, avatarUrl: p.avatar_url as string | null },
            ])
          )
          setMembers(
            pm.map((m) => ({
              userId: m.user_id as string,
              fullName: pMap.get(m.user_id as string)?.fullName ?? 'Unknown',
              role: m.role as string,
              avatarUrl: pMap.get(m.user_id as string)?.avatarUrl ?? null,
            }))
          )
        }
      } catch (err) {
        console.error('useProjectMembers error:', err)
      } finally {
        if (!cancelled) {
          clearTimeout(timeout)
          setLoading(false)
        }
      }
    }

    fetchMembers()
    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [projectId])

  return { members, loading }
}
