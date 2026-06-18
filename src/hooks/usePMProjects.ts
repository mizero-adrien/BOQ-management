'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Project } from '@/types/database'

export function usePMProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    const timeout = setTimeout(() => {
      if (!cancelled) {
        cancelled = true
        setLoading(false)
        setError('Request timed out. Please reload the page.')
      }
    }, 20000)

    async function fetchProjects() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) return

        const { data, error: fetchError } = await supabase
          .from('projects')
          .select('*')
          .eq('pm_id', user.id)
          .order('created_at', { ascending: false })

        if (cancelled) return

        if (fetchError) {
          setError(fetchError.message)
          return
        }

        setProjects(data ?? [])
        setError(null)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load projects')
        }
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

  return { projects, loading, error }
}
