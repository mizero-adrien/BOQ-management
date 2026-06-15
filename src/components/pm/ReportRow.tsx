import { useRouter } from 'next/navigation'
import type { ReportWithEngineer } from '@/hooks/useTodayReports'
import { formatTime } from '@/lib/utils'

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function ReportRow({ report }: { report: ReportWithEngineer }) {
  const router = useRouter()
  const hasIssues = report.issues !== null && report.issues.trim() !== ''

  return (
    <div
      className="bg-white rounded-xl flex items-center gap-3 px-4 py-3.5 cursor-pointer mb-1.5"
      style={{ border: '0.5px solid #EEEEEE' }}
      onClick={() => router.push(`/pm/reports/${report.id}`)}
    >
      <div className="relative flex-shrink-0">
        {hasIssues && (
          <div
            className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full border-2 border-white"
            style={{ backgroundColor: '#E24B4A' }}
          />
        )}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: '#E4E9FA' }}
        >
          <span className="text-xs font-bold" style={{ color: '#00236F' }}>
            {getInitials(report.engineerName)}
          </span>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: '#111111' }}>
          {report.engineerName}
        </p>
        <p className="text-xs truncate" style={{ color: '#666666' }}>
          {report.projectName}
        </p>
        {report.submitted_at && (
          <p className="mt-0.5" style={{ color: '#BBBBBB', fontSize: '11px' }}>
            {formatTime(report.submitted_at)}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className="text-xs px-2.5 py-1 rounded-full"
          style={{ color: '#666666', backgroundColor: '#F5F6FA', border: '0.5px solid #EEEEEE' }}
        >
          {report.workers_count} workers
        </span>
        <span
          className="text-xs px-2 py-1 rounded-full font-medium"
          style={{ color: '#00236F', backgroundColor: '#E4E9FA' }}
        >
          {report.progress_pct}%
        </span>
      </div>
    </div>
  )
}
