'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Task } from '@/types/database'

export function useTodayTasks(engineerId: string | undefined) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!engineerId) return

    async function fetchTasks() {
      const supabase = createClient()
      const today = new Date().toISOString().split('T')[0]

      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', engineerId)
        .lte('due_date', today)
        .in('status', ['not_started', 'in_progress'])
        .order('due_date', { ascending: true })
        .limit(5)

      setTasks(data ?? [])
      setLoading(false)
    }

    fetchTasks()
  }, [engineerId])

  return { tasks, loading }
}
