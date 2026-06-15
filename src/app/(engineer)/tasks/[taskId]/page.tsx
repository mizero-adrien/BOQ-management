'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import type { TaskStatus } from '@/types/database'
import type { TaskWithZone } from '@/hooks/useTasks'

interface TaskDetail extends TaskWithZone {
  creatorName: string | null
}

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const taskId = params.taskId as string
  const [task, setTask] = useState<TaskDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchTask() {
      const supabase = createClient()
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*, zone:plan_zones(name)')
          .eq('id', taskId)
          .single()

        if (error || !data) {
          console.error('Task detail error: fetch failed:', error?.message)
          if (!cancelled) setLoading(false)
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', data.created_by)
          .single()

        if (!cancelled) {
          setTask({
            ...(data as unknown as TaskWithZone),
            creatorName: profile?.full_name ?? null,
          })
          setLoading(false)
        }
      } catch (err) {
        console.error('Task detail error: unexpected error:', err)
        if (!cancelled) setLoading(false)
      }
    }

    fetchTask()
    return () => {
      cancelled = true
    }
  }, [taskId])

  async function handleUpdateStatus(newStatus: TaskStatus) {
    if (!task) return
    setTask((prev) => (prev ? { ...prev, status: newStatus } : null))
    const supabase = createClient()
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId)
    if (error) {
      console.error('Task detail error: update failed:', error.message)
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const isOverdue = task ? task.due_date < today && task.status !== 'done' : false

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F6FA' }}>
      <div
        className="bg-white border-b px-4 pt-12 pb-4"
        style={{ borderColor: '#EEEEEE' }}
      >
        <button
          type="button"
          onClick={() => router.push('/tasks')}
          className="flex items-center gap-1.5 mb-3"
          style={{ color: '#00236F' }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#00236F"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span className="text-sm font-medium">My Tasks</span>
        </button>

        {loading ? (
          <div
            className="h-6 w-48 rounded animate-pulse"
            style={{ backgroundColor: '#EEEEEE' }}
          />
        ) : task ? (
          <h1 className="text-xl font-semibold" style={{ color: '#111111' }}>
            {task.title}
          </h1>
        ) : (
          <p className="text-sm" style={{ color: '#666666' }}>
            Task not found
          </p>
        )}
      </div>

      {!loading && task && (
        <div className="px-4 pt-5 pb-24 space-y-4">
          <div
            className="bg-white rounded-xl border p-4 space-y-3"
            style={{ borderColor: '#EEEEEE' }}
          >
            <DetailRow label="Status">
              <StatusBadge status={task.status} isOverdue={isOverdue} />
            </DetailRow>
            <DetailRow label="Due date">
              <span
                className="text-sm font-medium"
                style={{ color: isOverdue ? '#E24B4A' : '#111111' }}
              >
                {formatDate(task.due_date)}
              </span>
            </DetailRow>
            {task.zone && (
              <DetailRow label="Zone">
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: '#E4E9FA', color: '#00236F' }}
                >
                  {task.zone.name}
                </span>
              </DetailRow>
            )}
            {task.creatorName && (
              <DetailRow label="Assigned by">
                <span className="text-sm" style={{ color: '#111111' }}>
                  {task.creatorName}
                </span>
              </DetailRow>
            )}
          </div>

          {task.description && (
            <div
              className="bg-white rounded-xl border p-4"
              style={{ borderColor: '#EEEEEE' }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: '#BBBBBB' }}
              >
                Description
              </p>
              <p className="text-sm leading-relaxed" style={{ color: '#666666' }}>
                {task.description}
              </p>
            </div>
          )}

          {(task.status === 'not_started' || task.status === 'in_progress') && (
            <div className="flex gap-2">
              {task.status === 'not_started' ? (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('in_progress')}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold border"
                  style={{ color: '#00236F', borderColor: '#00236F' }}
                >
                  Start task
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('done')}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white"
                  style={{ backgroundColor: '#00236F' }}
                >
                  Mark as done
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: '#BBBBBB' }}
      >
        {label}
      </span>
      {children}
    </div>
  )
}

function StatusBadge({ status, isOverdue }: { status: TaskStatus; isOverdue: boolean }) {
  if (isOverdue) {
    return (
      <span
        className="text-xs font-medium px-2.5 py-1 rounded-full border"
        style={{ color: '#E24B4A', borderColor: '#E24B4A' }}
      >
        Overdue
      </span>
    )
  }
  if (status === 'in_progress') {
    return (
      <span
        className="text-xs font-medium px-2.5 py-1 rounded-full text-white"
        style={{ backgroundColor: '#00236F' }}
      >
        Active
      </span>
    )
  }
  if (status === 'done') {
    return (
      <span
        className="text-xs font-medium px-2.5 py-1 rounded-full text-white"
        style={{ backgroundColor: '#111111' }}
      >
        Done
      </span>
    )
  }
  return (
    <span
      className="text-xs font-medium px-2.5 py-1 rounded-full border"
      style={{ color: '#BBBBBB', borderColor: '#EEEEEE', backgroundColor: '#F5F6FA' }}
    >
      Pending
    </span>
  )
}
