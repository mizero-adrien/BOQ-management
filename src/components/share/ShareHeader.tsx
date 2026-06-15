import { formatDate } from '@/lib/utils'
import type { Project } from '@/types/database'

const STATUS_LABEL: Record<string, string> = {
  active: 'Active', completed: 'Completed', on_hold: 'On Hold', cancelled: 'Cancelled',
}
const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  active:    { bg: '#D1FAE5', color: '#065F46' },
  completed: { bg: '#E4E9FA', color: '#00236F' },
  on_hold:   { bg: '#FEF3C7', color: '#92400E' },
  cancelled: { bg: '#FEE2E2', color: '#991B1B' },
}

export default function ShareHeader({ project }: { project: Project }) {
  const style = STATUS_STYLE[project.status] ?? STATUS_STYLE.active

  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-start gap-3 mb-3">
        <h1 className="text-2xl font-bold" style={{ color: '#111111' }}>{project.name}</h1>
        <span className="text-xs font-semibold rounded-full px-3 py-1 mt-0.5"
          style={{ backgroundColor: style.bg, color: style.color }}>
          {STATUS_LABEL[project.status] ?? project.status}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1">
        {project.client_name && (
          <p className="text-sm" style={{ color: '#666666' }}>
            Client: <span style={{ color: '#111111' }}>{project.client_name}</span>
          </p>
        )}
        {project.location && (
          <p className="text-sm" style={{ color: '#666666' }}>
            Location: <span style={{ color: '#111111' }}>{project.location}</span>
          </p>
        )}
        <p className="text-sm" style={{ color: '#666666' }}>
          Started: <span style={{ color: '#111111' }}>{formatDate(project.start_date)}</span>
        </p>
        <p className="text-sm" style={{ color: '#666666' }}>
          Expected end: <span style={{ color: '#111111' }}>{formatDate(project.expected_end_date)}</span>
        </p>
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold" style={{ color: '#666666' }}>Overall progress</span>
          <span className="text-xs font-bold" style={{ color: '#00236F' }}>{project.overall_progress}%</span>
        </div>
        <div className="rounded-full overflow-hidden" style={{ height: '8px', backgroundColor: '#EEEEEE' }}>
          <div className="h-full rounded-full" style={{ width: `${Math.min(100, project.overall_progress)}%`, backgroundColor: '#00236F' }} />
        </div>
      </div>
    </div>
  )
}
