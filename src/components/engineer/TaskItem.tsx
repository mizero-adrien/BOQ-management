import { formatDate } from '@/lib/utils'

interface Task {
  id: string
  title: string
  due_date: string
  status: string
}

interface TaskItemProps {
  task: Task
  isLast: boolean
}

export default function TaskItem({ task, isLast }: TaskItemProps) {
  const isOverdue = new Date(task.due_date) < new Date() && task.status !== 'done'

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3.5 ${!isLast ? 'border-b' : ''}`}
      style={{ borderColor: '#EEEEEE' }}
    >
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{
          backgroundColor:
            task.status === 'in_progress'
              ? '#00236F'
              : isOverdue
              ? '#E24B4A'
              : '#BBBBBB',
        }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: '#111111' }}>
          {task.title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: isOverdue ? '#E24B4A' : '#BBBBBB' }}>
          {isOverdue ? 'Overdue' : 'Due ' + formatDate(task.due_date)}
        </p>
      </div>
      <StatusBadge status={task.status} isOverdue={isOverdue} />
    </div>
  )
}

function StatusBadge({ status, isOverdue }: { status: string; isOverdue: boolean }) {
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
  return (
    <span
      className="text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0"
      style={{ color: '#BBBBBB', borderColor: '#EEEEEE', backgroundColor: '#F5F6FA' }}
    >
      Pending
    </span>
  )
}
