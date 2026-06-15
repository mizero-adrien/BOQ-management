'use client'

import { useState } from 'react'
import type { TaskStatus } from '@/types/database'
import type { TaskWithEngineer } from '@/hooks/usePMTasks'

const STATUS_MAP: Record<TaskStatus, { label: string; bg: string; color: string }> = {
  not_started: { label: 'Not started', bg: '#F5F6FA', color: '#666666' },
  in_progress: { label: 'In progress', bg: '#E4E9FA', color: '#00236F' },
  done: { label: 'Done', bg: '#E4E9FA', color: '#00236F' },
  overdue: { label: 'Overdue', bg: '#FFF5F5', color: '#E24B4A' },
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const { label, bg, color } = STATUS_MAP[status] ?? STATUS_MAP.not_started
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
      style={{ backgroundColor: bg, color }}
    >
      {label}
    </span>
  )
}

function TrashIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-.867 14.142A2 2 0 0 1 16.138 22H7.862a2 2 0 0 1-1.995-1.858L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

interface TaskRowProps {
  task: TaskWithEngineer
  onDelete: (taskId: string) => Promise<void>
}

export default function TaskRow({ task, onDelete }: TaskRowProps) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [trashColor, setTrashColor] = useState('#BBBBBB')

  async function handleConfirmedDelete() {
    setDeleting(true)
    try {
      await onDelete(task.id)
    } catch (err) {
      console.error('Delete task error:', err)
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <div
      className="bg-white rounded-lg px-3.5 py-3 mb-1.5"
      style={{ border: '0.5px solid #EEEEEE' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: '#111111' }}>
            {task.title}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#666666' }}>
            {task.engineerName}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={task.status} />
          <button
            type="button"
            onClick={() => setConfirming(true)}
            onMouseEnter={() => setTrashColor('#E24B4A')}
            onMouseLeave={() => setTrashColor('#BBBBBB')}
            style={{ color: trashColor }}
            aria-label="Delete task"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
      {confirming && (
        <div
          className="flex items-center gap-2 mt-2 pt-2"
          style={{ borderTop: '0.5px solid #EEEEEE' }}
        >
          <p className="text-xs flex-1" style={{ color: '#666666' }}>
            Delete this task?
          </p>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="text-xs px-2.5 py-1 rounded-lg"
            style={{ color: '#666666', border: '0.5px solid #EEEEEE' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmedDelete}
            disabled={deleting}
            className="text-xs px-2.5 py-1 rounded-lg text-white"
            style={{ backgroundColor: '#E24B4A' }}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      )}
    </div>
  )
}
