import type { ReportListItem } from '@/hooks/usePMReports'
import ReportListRow from './ReportListRow'

const COLS = ['Engineer', 'Project', 'Date', 'Workers', 'Progress', 'Issues', 'Status', 'Actions']

export default function ReportsTable({ reports }: { reports: ReportListItem[] }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #EEEEEE' }}>
      <table className="w-full" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#F5F6FA', borderBottom: '1px solid #EEEEEE' }}>
            {COLS.map((col) => (
              <th
                key={col}
                className="text-left px-4 py-2.5 uppercase tracking-wider"
                style={{ color: '#BBBBBB', fontSize: '11px', fontWeight: 600 }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <ReportListRow key={r.id} report={r} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
