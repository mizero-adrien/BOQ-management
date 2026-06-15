import type { TaskWithEngineer } from '@/hooks/usePMTasks'

interface CalendarDayProps {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  dayTasks: TaskWithEngineer[]
  onSelect: (date: Date) => void
}

export default function CalendarDay({
  date,
  isCurrentMonth,
  isToday,
  isSelected,
  dayTasks,
  onSelect,
}: CalendarDayProps) {
  const visibleTasks = dayTasks.slice(0, 2)
  const extraCount = dayTasks.length - 2

  const bgColor = isToday ? '#00236F' : isSelected ? '#E4E9FA' : undefined
  const dateColor = isToday
    ? '#FFFFFF'
    : isSelected
    ? '#00236F'
    : isCurrentMonth
    ? '#111111'
    : '#BBBBBB'
  const dotColor = isToday ? '#FFFFFF' : '#00236F'
  const canHover = !isToday && !isSelected

  return (
    <div
      className={`cursor-pointer rounded-lg p-1 overflow-hidden flex flex-col aspect-square md:aspect-auto md:h-[72px]${
        canHover ? ' hover:bg-[#F5F6FA]' : ''
      }`}
      style={bgColor ? { backgroundColor: bgColor } : {}}
      onClick={() => onSelect(date)}
    >
      <span
        className="font-medium leading-none block"
        style={{ color: dateColor, fontSize: '12px' }}
      >
        {date.getDate()}
      </span>
      {dayTasks.length > 0 && (
        <div
          className="w-1 h-1 rounded-full mt-0.5"
          style={{ backgroundColor: dotColor }}
        />
      )}
      <div className="hidden md:flex flex-col gap-0.5 mt-0.5 overflow-hidden">
        {visibleTasks.map((task) => (
          <span
            key={task.id}
            className="block truncate"
            style={{
              backgroundColor: isToday ? 'rgba(255,255,255,0.2)' : '#E4E9FA',
              color: isToday ? '#FFFFFF' : '#00236F',
              fontSize: '9px',
              borderRadius: '4px',
              padding: '1px 4px',
            }}
          >
            {task.title}
          </span>
        ))}
        {extraCount > 0 && (
          <span style={{ fontSize: '9px', color: isToday ? 'rgba(255,255,255,0.7)' : '#BBBBBB' }}>
            +{extraCount} more
          </span>
        )}
      </div>
    </div>
  )
}
