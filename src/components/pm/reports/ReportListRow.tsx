import { useRouter } from 'next/navigation'
import type { ReportListItem } from '@/hooks/usePMReports'
import { formatDate, formatTime } from '@/lib/utils'

function initials(name: string) {
  return name.split(' ').map((n) => n[0] ?? '').slice(0, 2).join('').toUpperCase()
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'submitted') {
    return (
      <span className="text-xs font-medium px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: '#111111' }}>
        Submitted
      </span>
    )
  }
  return (
    <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ color: '#666666', border: '1px solid #EEEEEE' }}>
      Draft
    </span>
  )
}

export default function ReportListRow({ report }: { report: ReportListItem }) {
  const router = useRouter()
  const hasIssues = !!report.issues?.trim()

  return (
    <tr
      className="cursor-pointer"
      style={{ borderBottom: '1px solid #EEEEEE' }}
      onClick={() => router.push(`/pm/reports/${report.id}`)}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FAFAFA')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
    >
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#E4E9FA' }}>
            <span className="text-xs font-bold" style={{ color: '#00236F' }}>{initials(report.engineerName)}</span>
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: '#111111' }}>{report.engineerName}</p>
            <p style={{ color: '#BBBBBB', fontSize: '11px' }}>{report.engineerRole}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <span className="text-sm" style={{ color: '#666666' }}>{report.projectName}</span>
      </td>
      <td className="px-4 py-3.5">
        <p className="text-sm" style={{ color: '#111111' }}>{formatDate(report.report_date)}</p>
        {report.submitted_at && (
          <p style={{ color: '#BBBBBB', fontSize: '11px' }}>{formatTime(report.submitted_at)}</p>
        )}
      </td>
      <td className="px-4 py-3.5">
        <span className="text-sm" style={{ color: '#111111' }}>{report.workers_count} workers</span>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <div className="rounded-full overflow-hidden" style={{ width: '60px', height: '6px', backgroundColor: '#EEEEEE' }}>
            <div className="h-full rounded-full" style={{ width: `${report.progress_pct}%`, backgroundColor: '#00236F' }} />
          </div>
          <span style={{ color: '#111111', fontSize: '12px' }}>{report.progress_pct}%</span>
        </div>
      </td>
      <td className="px-4 py-3.5" style={{ maxWidth: '160px' }}>
        {hasIssues ? (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#E24B4A' }} />
            <span className="text-xs truncate" style={{ color: '#111111' }}>
              {(report.issues ?? '').slice(0, 40)}{(report.issues ?? '').length > 40 ? '...' : ''}
            </span>
          </div>
        ) : (
          <span style={{ color: '#BBBBBB' }}>—</span>
        )}
      </td>
      <td className="px-4 py-3.5">
        <StatusBadge status={report.status} />
      </td>
      <td className="px-4 py-3.5">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); router.push(`/pm/reports/${report.id}`) }}
          className="text-xs px-3 py-1.5 rounded-lg"
          style={{ border: '1px solid #00236F', color: '#00236F' }}
        >
          View
        </button>
      </td>
    </tr>
  )
}
