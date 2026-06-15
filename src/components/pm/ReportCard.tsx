import { useRouter } from 'next/navigation'
import type { ReportListItem } from '@/hooks/usePMReports'
import { formatDate } from '@/lib/utils'

function initials(name: string) {
  return name.split(' ').map((n) => n[0] ?? '').slice(0, 2).join('').toUpperCase()
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'submitted') {
    return (
      <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: '#111111' }}>
        Submitted
      </span>
    )
  }
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ color: '#666666', border: '1px solid #EEEEEE' }}>
      Draft
    </span>
  )
}

export default function ReportCard({ report }: { report: ReportListItem }) {
  const router = useRouter()
  const hasIssues = !!report.issues?.trim()

  return (
    <div
      className="bg-white rounded-xl p-4 mb-2 cursor-pointer"
      style={{ border: '1px solid #EEEEEE' }}
      onClick={() => router.push(`/pm/reports/${report.id}`)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#E4E9FA' }}>
            <span className="text-xs font-bold" style={{ color: '#00236F' }}>{initials(report.engineerName)}</span>
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: '#111111' }}>{report.engineerName}</p>
            <p className="text-xs" style={{ color: '#BBBBBB' }}>{report.engineerRole}</p>
          </div>
        </div>
        <span className="text-xs" style={{ color: '#666666' }}>{formatDate(report.report_date)}</span>
      </div>

      <div className="flex items-center gap-3 text-xs mb-2" style={{ color: '#666666' }}>
        <span>{report.projectName}</span>
        <span>{report.workers_count} workers</span>
        <span style={{ color: '#00236F', fontWeight: 500 }}>{report.progress_pct}%</span>
      </div>

      {hasIssues && (
        <p className="text-xs mb-2 line-clamp-1" style={{ color: '#E24B4A' }}>{report.issues}</p>
      )}

      <div className="flex items-center justify-between">
        <StatusBadge status={report.status} />
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); router.push(`/pm/reports/${report.id}`) }}
          className="text-xs px-3 py-1 rounded-lg"
          style={{ border: '1px solid #00236F', color: '#00236F' }}
        >
          View report
        </button>
      </div>
    </div>
  )
}
