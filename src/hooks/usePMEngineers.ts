'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Project } from '@/types/database'

export function usePMEngineers(projects: Project[]) {
  const [engineers, setEngineers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (projects.length === 0) {
      setEngineers([])
      setLoading(false)
      return
    }

    const supabase = createClient()
    let cancelled = false
    const projectIds = projects.map((p) => p.id)

    const timeout = setTimeout(() => {
      if (!cancelled) {
        console.error('PM engineers error: timed out after 8 seconds')
        setLoading(false)
      }
    }, 8000)

    async function fetchEngineers() {
      setLoading(true)
      try {
        const { data: members, error: membersError } = await supabase
          .from('project_members')
          .select('user_id')
          .in('project_id', projectIds)
          .in('role', ['engineer', 'foreman'])

        if (membersError) {
          console.error('PM engineers error: members fetch failed:', membersError.message)
          return
        }

        const userIds = [
          ...new Set((members ?? []).map((m) => m.user_id as string)),
        ]

        if (userIds.length === 0) {
          if (!cancelled) setEngineers([])
          return
        }

        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds)
          .order('full_name', { ascending: true })

        if (profilesError) {
          console.error('PM engineers error: profiles fetch failed:', profilesError.message)
          return
        }

        if (!cancelled) {
          setEngineers(profiles ?? [])
        }
      } catch (err) {
        console.error('PM engineers error: unexpected error:', err)
      } finally {
        if (!cancelled) {
          clearTimeout(timeout)
          setLoading(false)
        }
      }
    }

    fetchEngineers()

    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [projects])

  return { engineers, loading }
}
