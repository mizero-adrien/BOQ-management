import { isSameDay, parseLocalDate, formatDayLabel } from '@/lib/utils/calendar'
import type { TaskWithEngineer } from '@/hooks/usePMTasks'
import TaskRow from './TaskRow'

interface DayTaskListProps {
  selectedDate: Date
  tasks: TaskWithEngineer[]
  onDelete: (taskId: string) => Promise<void>
}

export default function DayTaskList({
  selectedDate,
  tasks,
  onDelete,
}: DayTaskListProps) {
  const dayTasks = tasks.filter((t) =>
    isSameDay(parseLocalDate(t.due_date), selectedDate)
  )

  return (
    <div
      className="mt-6 pt-6"
      style={{ borderTop: '1px solid #EEEEEE' }}
    >
      <h3
        className="font-semibold mb-3"
        style={{ color: '#111111', fontSize: '14px' }}
      >
        Tasks for {formatDayLabel(selectedDate)}
      </h3>
      {dayTasks.length === 0 ? (
        <p style={{ color: '#BBBBBB', fontSize: '13px' }}>
          No tasks scheduled for this day
        </p>
      ) : (
        dayTasks.map((task) => (
          <TaskRow key={task.id} task={task} onDelete={onDelete} />
        ))
      )}
    </div>
  )
}
