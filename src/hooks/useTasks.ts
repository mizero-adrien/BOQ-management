'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Task, TaskStatus } from '@/types/database'

export interface TaskWithZone extends Task {
  zone: { name: string } | null
}

export function useTasks() {
  const [tasks, setTasks] = useState<TaskWithZone[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    const timeout = setTimeout(() => {
      if (!cancelled) {
        console.error('Tasks error: timed out after 8 seconds')
        setLoading(false)
      }
    }, 8000)

    async function fetchTasks() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError) {
          console.error('Tasks error: getUser failed:', userError.message)
          return
        }

        if (!user) {
          return
        }

        const { data, error } = await supabase
          .from('tasks')
          .select('*, zone:plan_zones(name)')
          .eq('assigned_to', user.id)
          .order('due_date', { ascending: true })

        if (error) {
          console.error('Tasks error: fetch failed:', error.message)
          return
        }

        if (!cancelled) {
          setTasks((data as unknown as TaskWithZone[]) ?? [])
        }
      } catch (err) {
        console.error('Tasks error: unexpected error:', err)
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
  }, [])

  const updateTaskStatus = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)))

    const supabase = createClient()
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId)

    if (error) {
      console.error('Tasks error: updateTaskStatus failed:', error.message)
    }
  }, [])

  return { tasks, loading, updateTaskStatus }
}
