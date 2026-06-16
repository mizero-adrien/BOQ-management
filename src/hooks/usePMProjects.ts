'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Project } from '@/types/database'

export function usePMProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    const controller = new AbortController()

    const timeout = setTimeout(() => {
      controller.abort()
      setLoading(false)
      console.error('usePMProjects: query timed out after 8 s')
    }, 8000)

    async function fetchProjects() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) return

        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('pm_id', user.id)
          .order('created_at', { ascending: false })
          .abortSignal(controller.signal)

        if (controller.signal.aborted) return

        if (error) {
          console.error('usePMProjects: fetch failed:', error.message)
          return
        }

        setProjects(data ?? [])
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error('usePMProjects: unexpected error:', err)
        }
      } finally {
        if (!controller.signal.aborted) {
          clearTimeout(timeout)
          setLoading(false)
        }
      }
    }

    fetchProjects()

    return () => {
      controller.abort()
      clearTimeout(timeout)
    }
  }, [])

  return { projects, loading }
}
