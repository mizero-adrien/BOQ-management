import { formatDate } from '@/lib/utils'

const TASK_COLOR: Record<string, string> = {
  done: '#00236F', in_progress: '#778EDE', not_started: '#BBBBBB', overdue: '#E24B4A',
}

interface TaskRow {
  id: string
  title: string
  due_date: string
  status: string
}

interface ReportRow {
  id: string
  report_date: string
  workers_count: number
  progress_pct: number
  issues: string | null
}

interface Props {
  tasks: TaskRow[]
  reports: ReportRow[]
}

export default function ShareActivity({ tasks, reports }: Props) {
  return (
    <div className="grid md:grid-cols-2 gap-4 mb-6">
      {/* Upcoming tasks */}
      <div className="bg-white rounded-xl p-5" style={{ border: '0.5px solid #EEEEEE' }}>
        <p className="text-sm font-semibold mb-3" style={{ color: '#111111' }}>Upcoming Tasks</p>
        {tasks.length === 0 ? (
          <p className="text-sm" style={{ color: '#BBBBBB' }}>No open tasks.</p>
        ) : (
          <div className="flex flex-col">
            {tasks.map((t, i) => (
              <div key={t.id} className="flex items-center gap-2.5 py-2.5"
                style={{ borderBottom: i < tasks.length - 1 ? '1px solid #EEEEEE' : 'none' }}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: TASK_COLOR[t.status] ?? '#BBBBBB' }} />
                <p className="text-sm flex-1 truncate" style={{ color: '#111111' }}>{t.title}</p>
                <span className="text-xs flex-shrink-0" style={{ color: '#BBBBBB' }}>{formatDate(t.due_date)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent reports */}
      <div className="bg-white rounded-xl p-5" style={{ border: '0.5px solid #EEEEEE' }}>
        <p className="text-sm font-semibold mb-3" style={{ color: '#111111' }}>Recent Reports</p>
        {reports.length === 0 ? (
          <p className="text-sm" style={{ color: '#BBBBBB' }}>No reports submitted yet.</p>
        ) : (
          <div className="flex flex-col">
            {reports.map((r, i) => (
              <div key={r.id} className="py-2.5"
                style={{ borderBottom: i < reports.length - 1 ? '1px solid #EEEEEE' : 'none' }}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium" style={{ color: '#111111' }}>{formatDate(r.report_date)}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: '#666666' }}>{r.workers_count} workers</span>
                    <span className="text-xs font-semibold" style={{ color: '#00236F' }}>{r.progress_pct}%</span>
                  </div>
                </div>
                {r.issues && (
                  <p className="text-xs truncate" style={{ color: '#E24B4A' }}>{r.issues}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
