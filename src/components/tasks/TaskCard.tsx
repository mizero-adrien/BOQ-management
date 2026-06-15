'use client'

import type { TaskStatus } from '@/types/database'
import type { TaskWithZone } from '@/hooks/useTasks'

interface TaskCardProps {
  task: TaskWithZone
  onTap: () => void
  onUpdateStatus: (id: string, status: TaskStatus) => Promise<void>
}

function formatDueDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-RW', {
    day: 'numeric',
    month: 'short',
  })
}

export default function TaskCard({ task, onTap, onUpdateStatus }: TaskCardProps) {
  const today = new Date().toISOString().split('T')[0]
  const isOverdue = task.due_date < today && task.status !== 'done'
  const showActions = task.status === 'not_started' || task.status === 'in_progress'

  return (
    <div
      className="bg-white rounded-xl mb-2"
      style={{ border: '0.5px solid #EEEEEE' }}
    >
      <button
        type="button"
        onClick={onTap}
        className="w-full flex items-start gap-3 px-4 pt-4 pb-3 text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: '#111111' }}>
            {task.title}
          </p>
          {task.zone && (
            <span
              className="inline-block mt-1 px-2 py-0.5 rounded-full"
              style={{ backgroundColor: '#E4E9FA', color: '#00236F', fontSize: '11px' }}
            >
              {task.zone.name}
            </span>
          )}
          <p
            className="text-xs mt-1"
            style={{ color: isOverdue ? '#E24B4A' : '#BBBBBB' }}
          >
            {isOverdue ? 'Overdue' : `Due ${formatDueDate(task.due_date)}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
          <StatusBadge status={task.status} isOverdue={isOverdue} />
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#BBBBBB"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </button>

      {showActions && (
        <div className="flex gap-2 px-4 pb-3">
          {task.status === 'not_started' ? (
            <>
              <button
                type="button"
                onClick={() => onUpdateStatus(task.id, 'in_progress')}
                className="flex-1 py-2 rounded-lg text-xs font-semibold border"
                style={{ color: '#00236F', borderColor: '#00236F' }}
              >
                Start task
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg text-xs font-semibold"
                style={{ color: '#666666' }}
              >
                Skip
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onUpdateStatus(task.id, 'done')}
                className="flex-1 py-2 rounded-lg text-xs font-semibold text-white"
                style={{ backgroundColor: '#00236F' }}
              >
                Mark as done
              </button>
              <button
                type="button"
                className="flex-1 py-2 rounded-lg text-xs font-semibold border"
                style={{ color: '#00236F', borderColor: '#00236F' }}
              >
                Add note
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status, isOverdue }: { status: TaskStatus; isOverdue: boolean }) {
  if (isOverdue) {
    return (
      <span
        className="text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0"
        style={{ color: '#E24B4A', borderColor: '#E24B4A' }}
      >
        Overdue
      </span>
    )
  }
  if (status === 'in_progress') {
    return (
      <span
        className="text-xs font-medium px-2.5 py-1 rounded-full text-white flex-shrink-0"
        style={{ backgroundColor: '#00236F' }}
      >
        Active
      </span>
    )
  }
  if (status === 'done') {
    return (
      <span
        className="text-xs font-medium px-2.5 py-1 rounded-full text-white flex-shrink-0"
        style={{ backgroundColor: '#111111' }}
      >
        Done
      </span>
    )
  }
  return (
    <span
      className="text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0"
      style={{ color: '#BBBBBB', borderColor: '#EEEEEE', backgroundColor: '#F5F6FA' }}
    >
      Pending
    </span>
  )
}
