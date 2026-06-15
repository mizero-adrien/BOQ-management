import { useMemo } from 'react'
import { getCalendarDays, isSameDay, parseLocalDate } from '@/lib/utils/calendar'
import type { TaskWithEngineer } from '@/hooks/usePMTasks'
import CalendarDay from './CalendarDay'

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface CalendarGridProps {
  viewMonth: Date
  selectedDate: Date
  tasks: TaskWithEngineer[]
  onSelectDay: (date: Date) => void
  loading: boolean
}

export default function CalendarGrid({
  viewMonth,
  selectedDate,
  tasks,
  onSelectDay,
  loading,
}: CalendarGridProps) {
  const today = useMemo(() => new Date(), [])

  const days = useMemo(
    () => getCalendarDays(viewMonth.getFullYear(), viewMonth.getMonth()),
    [viewMonth]
  )

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-7 mb-2">
          {DAY_HEADERS.map((h) => (
            <div
              key={h}
              className="h-4 rounded mx-0.5"
              style={{ backgroundColor: '#F5F6FA' }}
            />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg aspect-square md:aspect-auto md:h-[72px]"
              style={{ backgroundColor: '#F5F6FA' }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map((h) => (
          <div
            key={h}
            className="text-center py-1 uppercase"
            style={{ color: '#BBBBBB', fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em' }}
          >
            {h}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day, idx) => {
          const dayTasks = tasks.filter((t) =>
            isSameDay(parseLocalDate(t.due_date), day)
          )
          return (
            <CalendarDay
              key={idx}
              date={day}
              isCurrentMonth={day.getMonth() === viewMonth.getMonth()}
              isToday={isSameDay(day, today)}
              isSelected={isSameDay(day, selectedDate)}
              dayTasks={dayTasks}
              onSelect={onSelectDay}
            />
          )
        })}
      </div>
    </>
  )
}
