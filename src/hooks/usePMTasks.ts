'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import type { Project, Task } from '@/types/database'

export interface TaskWithEngineer extends Task {
  engineerName: string
  zoneName: string | null
}

export interface CreateTaskParams {
  projectId: string
  assignedTo: string
  zoneId: string | null
  title: string
  description: string | null
  dueDate: string
  engineerName: string
  zoneName: string | null
}

type RawTaskRow = Task & {
  engineer: { full_name: string } | null
  zone: { name: string } | null
}

export function usePMTasks(projects: Project[]) {
  const [tasks, setTasks] = useState<TaskWithEngineer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (projects.length === 0) {
      setTasks([])
      setLoading(false)
      return
    }

    const supabase = createClient()
    let cancelled = false
    const projectIds = projects.map((p) => p.id)

    const timeout = setTimeout(() => {
      if (!cancelled) {
        console.error('PM tasks error: timed out after 8 seconds')
        setLoading(false)
      }
    }, 8000)

    async function fetchTasks() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*, engineer:profiles!assigned_to(full_name), zone:plan_zones!zone_id(name)')
          .in('project_id', projectIds)
          .order('due_date', { ascending: true })

        if (error) {
          console.error('PM tasks error: fetch failed:', error.message)
          return
        }

        if (!cancelled) {
          const mapped: TaskWithEngineer[] = (data as unknown as RawTaskRow[]).map((row) => {
            const { engineer, zone, ...taskData } = row
            return {
              ...taskData,
              engineerName: engineer?.full_name ?? 'Unknown',
              zoneName: zone?.name ?? null,
            }
          })
          setTasks(mapped)
        }
      } catch (err) {
        console.error('PM tasks error: unexpected error:', err)
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
  }, [projects])

  const createTask = useCallback(async (params: CreateTaskParams): Promise<TaskWithEngineer> => {
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        project_id: params.projectId,
        assigned_to: params.assignedTo,
        created_by: user.id,
        zone_id: params.zoneId,
        title: params.title,
        description: params.description,
        due_date: params.dueDate,
        status: 'not_started',
      })
      .select()
      .single()

    if (error) throw error

    await supabase.from('notifications').insert({
      user_id: params.assignedTo,
      project_id: params.projectId,
      type: 'task_assigned',
      title: 'New task assigned',
      body: `You have been assigned to ${params.title} — due ${formatDate(params.dueDate)}`,
      read: false,
      action_url: '/tasks',
    })

    const newTask: TaskWithEngineer = {
      ...(data as unknown as Task),
      engineerName: params.engineerName,
      zoneName: params.zoneName,
    }
    setTasks((prev) => [...prev, newTask])
    return newTask
  }, [])

  const deleteTask = useCallback(async (taskId: string): Promise<void> => {
    const supabase = createClient()
    const { error } = await supabase.from('tasks').delete().eq('id', taskId)
    if (error) throw error
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
  }, [])

  return { tasks, loading, createTask, deleteTask }
}
