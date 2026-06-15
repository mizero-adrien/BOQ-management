import { useRouter } from 'next/navigation'
import type { ReportWithEngineer } from '@/hooks/useTodayReports'
import { formatTime } from '@/lib/utils'

export default function IssueItem({ report }: { report: ReportWithEngineer }) {
  const router = useRouter()

  return (
    <div
      className="bg-white rounded-xl flex gap-3 px-4 py-3 cursor-pointer mb-1.5"
      style={{
        border: '0.5px solid #EEEEEE',
        borderLeft: '3px solid #E24B4A',
      }}
      onClick={() => router.push(`/pm/reports/${report.id}`)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p
            className="text-sm font-medium truncate"
            style={{ color: '#111111' }}
          >
            {report.engineerName} — {report.projectName}
          </p>
          {report.submitted_at && (
            <p
              className="flex-shrink-0"
              style={{ color: '#BBBBBB', fontSize: '11px' }}
            >
              {formatTime(report.submitted_at)}
            </p>
          )}
        </div>
        <p
          className="text-sm mt-1 line-clamp-2"
          style={{ color: '#666666' }}
        >
          {report.issues}
        </p>
      </div>
    </div>
  )
}
