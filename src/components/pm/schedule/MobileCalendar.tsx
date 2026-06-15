'use client'

import { isSameDay, parseLocalDate } from '@/lib/utils/calendar'
import type { TaskWithEngineer } from '@/hooks/usePMTasks'

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

interface Props {
  selectedDate: Date
  tasks: TaskWithEngineer[]
  onSelectDay: (date: Date) => void
}

function getWeekDays(anchor: Date): Date[] {
  const d = new Date(anchor)
  // Move to Monday of the current week
  const dow = d.getDay() === 0 ? 6 : d.getDay() - 1
  d.setDate(d.getDate() - dow)
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(d)
    day.setDate(d.getDate() + i)
    return day
  })
}

export default function MobileCalendar({ selectedDate, tasks, onSelectDay }: Props) {
  const today = new Date()
  const week = getWeekDays(selectedDate)

  const selectedTasks = tasks.filter((t) => isSameDay(parseLocalDate(t.due_date), selectedDate))

  return (
    <div>
      {/* Week strip */}
      <div className="bg-white rounded-xl p-4 mb-4" style={{ border: '0.5px solid #EEEEEE' }}>
        <div className="grid grid-cols-7 gap-1">
          {week.map((day, i) => {
            const isSelected = isSameDay(day, selectedDate)
            const isToday = isSameDay(day, today)
            const hasTasks = tasks.some((t) => isSameDay(parseLocalDate(t.due_date), day))
            return (
              <button
                key={i}
                type="button"
                onClick={() => onSelectDay(day)}
                className="flex flex-col items-center py-2 rounded-xl gap-1"
                style={{ backgroundColor: isSelected ? '#00236F' : 'transparent' }}
              >
                <span style={{ fontSize: '10px', fontWeight: 600, color: isSelected ? 'rgba(255,255,255,0.7)' : '#BBBBBB' }}>
                  {DAY_LETTERS[i]}
                </span>
                <span style={{ fontSize: '15px', fontWeight: isToday ? 700 : 500, color: isSelected ? '#FFFFFF' : isToday ? '#00236F' : '#111111' }}>
                  {day.getDate()}
                </span>
                <div
                  className="rounded-full"
                  style={{ width: '5px', height: '5px', backgroundColor: hasTasks ? (isSelected ? '#FFFFFF' : '#778EDE') : 'transparent' }}
                />
              </button>
            )
          })}
        </div>
      </div>

      {/* Tasks for selected day */}
      <div className="bg-white rounded-xl p-4" style={{ border: '0.5px solid #EEEEEE' }}>
        <p className="text-sm font-semibold mb-3" style={{ color: '#111111' }}>
          {selectedDate.toLocaleDateString('en-RW', { weekday: 'long', day: 'numeric', month: 'short' })}
        </p>
        {selectedTasks.length === 0 ? (
          <p className="text-sm" style={{ color: '#BBBBBB' }}>No tasks scheduled for this day.</p>
        ) : (
          selectedTasks.map((task) => (
            <div key={task.id} className="flex items-center gap-2.5 py-2.5" style={{ borderBottom: '1px solid #EEEEEE' }}>
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#778EDE' }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: '#111111' }}>{task.title}</p>
                {task.engineerName && (
                  <p className="text-xs" style={{ color: '#BBBBBB' }}>{task.engineerName}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
