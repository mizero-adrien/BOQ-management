'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Project } from '@/types/database'

export function usePMProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    const timeout = setTimeout(() => {
      if (!cancelled) {
        console.error('PM projects error: timed out after 8 seconds')
        setLoading(false)
      }
    }, 8000)

    async function fetchProjects() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError) {
          console.error('PM projects error: getUser failed:', userError.message)
          return
        }

        if (!user) {
          return
        }

        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('pm_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('PM projects error: fetch failed:', error.message)
          return
        }

        if (!cancelled) {
          setProjects(data ?? [])
        }
      } catch (err) {
        console.error('PM projects error: unexpected error:', err)
      } finally {
        if (!cancelled) {
          clearTimeout(timeout)
          setLoading(false)
        }
      }
    }

    fetchProjects()

    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [])

  return { projects, loading }
}
