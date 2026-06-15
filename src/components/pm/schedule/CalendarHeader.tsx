import { formatMonthYear } from '@/lib/utils/calendar'

interface CalendarHeaderProps {
  viewMonth: Date
  onPrev: () => void
  onNext: () => void
  onToday: () => void
}

function ChevronLeft() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

export default function CalendarHeader({
  viewMonth,
  onPrev,
  onNext,
  onToday,
}: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onPrev}
          className="flex items-center justify-center w-8 h-8 rounded-lg"
          style={{ color: '#111111' }}
          aria-label="Previous month"
        >
          <ChevronLeft />
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex items-center justify-center w-8 h-8 rounded-lg"
          style={{ color: '#111111' }}
          aria-label="Next month"
        >
          <ChevronRight />
        </button>
        <p
          className="font-semibold ml-1"
          style={{ color: '#111111', fontSize: '16px' }}
        >
          {formatMonthYear(viewMonth)}
        </p>
      </div>
      <button
        type="button"
        onClick={onToday}
        className="px-3 py-1 rounded-lg text-xs font-medium"
        style={{ color: '#00236F', border: '1px solid #00236F' }}
      >
        Today
      </button>
    </div>
  )
}
