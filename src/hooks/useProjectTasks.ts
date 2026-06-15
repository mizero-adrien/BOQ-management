'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Task } from '@/types/database'

export interface TaskWithEngineer extends Task {
  engineerName: string
  zoneName: string | null
}

export function useProjectTasks(projectId: string | undefined) {
  const [tasks, setTasks] = useState<TaskWithEngineer[]>([])
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

    async function fetchTasks() {
      const supabase = createClient()
      try {
        const { data } = await supabase
          .from('tasks')
          .select('*, engineer:profiles!assigned_to(full_name), zone:plan_zones!zone_id(name)')
          .eq('project_id', projectId)
          .order('due_date', { ascending: true })

        if (!cancelled && data) {
          setTasks(
            data.map((t) => ({
              ...(t as Task),
              engineerName:
                (t.engineer as { full_name: string } | null)?.full_name ?? 'Unknown',
              zoneName: (t.zone as { name: string } | null)?.name ?? null,
            }))
          )
        }
      } catch (err) {
        console.error('useProjectTasks error:', err)
      } finally {
        if (!cancelled) {
          clearTimeout(timeout)
          setLoading(false)
        }
      }
    }

    fetchTasks()
    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [projectId])

  return { tasks, loading }
}
