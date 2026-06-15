'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTasks } from '@/hooks/useTasks'
import { useActiveProject } from '@/hooks/useActiveProject'
import TaskCard from '@/components/tasks/TaskCard'
import { SkeletonCard } from '@/components/shared/Skeleton'

type FilterType = 'all' | 'today' | 'week' | 'overdue' | 'done'

const TABS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'done', label: 'Done' },
]

const EMPTY_MESSAGES: Record<FilterType, string> = {
  all: 'No tasks assigned yet',
  today: 'No tasks due today',
  week: 'No tasks due this week',
  overdue: 'No overdue tasks',
  done: 'No completed tasks yet',
}

export default function TasksPage() {
  const [filter, setFilter] = useState<FilterType>('all')
  const { project } = useActiveProject()
  const { tasks, loading, updateTaskStatus } = useTasks()
  const router = useRouter()

  const today = new Date().toISOString().split('T')[0]
  const weekEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  const filtered = useMemo(() => {
    switch (filter) {
      case 'today':
        return tasks.filter((t) => t.due_date === today)
      case 'week':
        return tasks.filter((t) => t.due_date >= today && t.due_date <= weekEnd)
      case 'overdue':
        return tasks.filter((t) => t.due_date < today && t.status !== 'done')
      case 'done':
        return tasks.filter((t) => t.status === 'done')
      default:
        return tasks
    }
  }, [tasks, filter, today, weekEnd])

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F6FA' }}>
      <div
        className="bg-white border-b px-4 pt-4 pb-3"
        style={{ borderColor: '#EEEEEE' }}
      >
        <h1 className="text-xl font-semibold" style={{ color: '#111111' }}>
          My Tasks
        </h1>
        {project && (
          <p className="mt-0.5" style={{ color: '#666666', fontSize: '13px' }}>
            {project.name}
          </p>
        )}
      </div>

      <div
        className="flex gap-2 px-4 py-2.5 overflow-x-auto"
        style={{ scrollbarWidth: 'none' }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className="flex-shrink-0 font-medium whitespace-nowrap"
            style={{
              backgroundColor: filter === tab.key ? '#00236F' : '#FFFFFF',
              color: filter === tab.key ? '#FFFFFF' : '#666666',
              border: filter === tab.key ? 'none' : '0.5px solid #EEEEEE',
              borderRadius: '20px',
              padding: '6px 16px',
              fontSize: '13px',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="px-4 pb-24 pt-1">
        {loading ? (
          <TasksSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState message={EMPTY_MESSAGES[filter]} />
        ) : (
          filtered.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onTap={() => router.push(`/tasks/${task.id}`)}
              onUpdateStatus={updateTaskStatus}
            />
          ))
        )}
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#BBBBBB"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="8" y="2" width="8" height="4" rx="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <path d="m9 12 2 2 4-4" />
      </svg>
      <p className="mt-4 text-sm" style={{ color: '#666666' }}>
        {message}
      </p>
    </div>
  )
}

function TasksSkeleton() {
  return (
    <div className="space-y-2 mt-1">
      {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} height="100px" />)}
    </div>
  )
}
