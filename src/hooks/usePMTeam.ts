'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Project } from '@/types/database'

export interface TeamMember {
  userId: string
  fullName: string
  role: string
  projectId: string
  projectName: string
}

export function usePMTeam(projects: Project[]) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (projects.length === 0) {
      setMembers([])
      setLoading(false)
      return
    }

    const supabase = createClient()
    let cancelled = false
    const projectIds = projects.map((p) => p.id)

    const timeout = setTimeout(() => {
      if (!cancelled) setLoading(false)
    }, 8000)

    async function fetchMembers() {
      setLoading(true)
      try {
        const { data: pm } = await supabase
          .from('project_members')
          .select('user_id, role, project_id')
          .in('project_id', projectIds)

        if (!pm || cancelled) return

        const userIds = [...new Set(pm.map((m) => m.user_id as string))]
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds)

        if (!cancelled) {
          const profileMap = new Map(
            (profiles ?? []).map((p) => [p.id as string, p.full_name as string])
          )
          const projectMap = new Map(projects.map((p) => [p.id, p.name]))

          setMembers(
            pm.map((m) => ({
              userId: m.user_id as string,
              fullName: profileMap.get(m.user_id as string) ?? 'Unknown',
              role: m.role as string,
              projectId: m.project_id as string,
              projectName: projectMap.get(m.project_id as string) ?? '',
            }))
          )
        }
      } catch (err) {
        console.error('usePMTeam error:', err)
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
  }, [projects])

  return { members, loading }
}
