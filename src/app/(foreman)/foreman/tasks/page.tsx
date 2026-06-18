'use client'

export const dynamic = 'force-dynamic'

import { useActiveProject } from '@/hooks/useActiveProject'
import { useProjectTasks } from '@/hooks/useProjectTasks'
import { formatDate } from '@/lib/utils/index'
import type { TaskWithEngineer } from '@/hooks/useProjectTasks'

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  not_started: { label: 'Not started', bg: '#F5F6FA', color: '#BBBBBB' },
  in_progress: { label: 'Active', bg: '#00236F', color: '#FFFFFF' },
  done: { label: 'Done', bg: '#E4E9FA', color: '#00236F' },
  overdue: { label: 'Overdue', bg: '#FFF5F5', color: '#E24B4A' },
}

function TaskCard({ task }: { task: TaskWithEngineer }) {
  const s = STATUS_MAP[task.status] ?? STATUS_MAP.not_started
  const isOverdue = task.status !== 'done' && new Date(task.due_date) < new Date()
  const displayStatus = isOverdue && task.status !== 'done' ? STATUS_MAP.overdue : s

  return (
    <div className="bg-white rounded-xl px-4 py-3.5 mb-2" style={{ border: '0.5px solid #EEEEEE' }}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: '#111111' }}>{task.title}</p>
          <p className="text-xs mt-0.5" style={{ color: '#666666' }}>{task.engineerName}</p>
          {task.description && (
            <p className="text-xs mt-1" style={{ color: '#BBBBBB' }}>{task.description}</p>
          )}
          <p className="text-xs mt-1" style={{ color: isOverdue ? '#E24B4A' : '#BBBBBB' }}>
            Due {formatDate(task.due_date)}
          </p>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0"
          style={{ backgroundColor: displayStatus.bg, color: displayStatus.color }}>
          {displayStatus.label}
        </span>
      </div>
    </div>
  )
}

export default function ForemanTasksPage() {
  const { project } = useActiveProject()
  const { tasks, loading } = useProjectTasks(project?.id)

  // Group by engineer name
  const grouped = tasks.reduce<Record<string, TaskWithEngineer[]>>((acc, t) => {
    const key = t.engineerName
    if (!acc[key]) acc[key] = []
    acc[key].push(t)
    return acc
  }, {})

  return (
    <div className="px-4 py-5 md:px-8 md:py-8" style={{ maxWidth: '640px', margin: '0 auto' }}>
      <h1 className="text-xl font-semibold mb-1" style={{ color: '#111111' }}>All Tasks</h1>
      <p className="text-sm mb-5" style={{ color: '#666666' }}>{project?.name ?? 'Loading...'} — read only view</p>

      {loading ? (
        <div className="animate-pulse space-y-2">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 rounded-xl" style={{ backgroundColor: '#EEEEEE' }} />)}
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-xl p-6 text-center" style={{ border: '0.5px solid #EEEEEE' }}>
          <p className="text-sm" style={{ color: '#BBBBBB' }}>No tasks yet for this project.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([engineer, engineerTasks]) => (
          <div key={engineer} className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#BBBBBB' }}>{engineer}</p>
            {engineerTasks.map((t) => <TaskCard key={t.id} task={t} />)}
          </div>
        ))
      )}
    </div>
  )
}
