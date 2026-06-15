'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Project } from '@/types/database'

export function useActiveProject() {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const timeout = setTimeout(() => {
      if (!cancelled) {
        console.error('Active project error: timed out after 8 seconds')
        setLoading(false)
      }
    }, 8000)

    async function fetchProject() {
      const supabase = createClient()

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) {
          console.error('Active project error: getUser failed:', userError.message)
          return
        }

        if (!user) {
          return
        }

        const { data: memberData, error: memberError } = await supabase
          .from('project_members')
          .select('project_id')
          .eq('user_id', user.id)
          .limit(5)

        if (memberError) {
          console.error('Active project error: project_members query failed:', memberError.message)
          return
        }

        if (!memberData || memberData.length === 0) {
          if (!cancelled) {
            setProject(null)
          }
          return
        }

        const projectIds = memberData.map((m: { project_id: string }) => m.project_id)

        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .in('id', projectIds)
          .eq('status', 'active')
          .limit(1)
          .single()

        if (projectError) {
          console.error('Active project error: projects query failed:', projectError.message)
          if (!cancelled) {
            setProject(null)
          }
          return
        }

        if (!cancelled) {
          setProject(projectData)
        }
      } catch (err) {
        console.error('Active project error: unexpected error:', err)
      } finally {
        if (!cancelled) {
          clearTimeout(timeout)
          setLoading(false)
        }
      }
    }

    fetchProject()

    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [])

  return { project, loading }
}
