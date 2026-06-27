'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEngineerReports } from '@/hooks/useEngineerReports'
import { formatDate } from '@/lib/utils'

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    submitted: { bg: '#EDFAF5', color: '#5DCAA5' },
    draft: { bg: '#F5F6FA', color: '#666666' },
    rejected: { bg: '#FFF5F5', color: '#E24B4A' },
  }
  const s = map[status] ?? map.draft
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ backgroundColor: s.bg, color: s.color }}>
      {status}
    </span>
  )
}

export default function ReportHistoryPage() {
  const today = new Date()
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  const [month, setMonth] = useState(defaultMonth)
  const { reports, loading } = useEngineerReports(month)
  const router = useRouter()

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F6FA' }}>
      <div className="bg-white border-b px-4 py-3" style={{ borderColor: '#EEEEEE' }}>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
          className="text-sm px-3 py-2 rounded-lg"
          style={{ border: '1px solid #EEEEEE', color: '#111111', backgroundColor: '#F5F6FA', outline: 'none' }} />
      </div>

      {loading ? (
        <div className="space-y-2 p-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse" style={{ backgroundColor: '#EEEEEE' }} />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <p className="text-sm font-medium" style={{ color: '#111111' }}>No reports this month</p>
          <p className="text-xs mt-1" style={{ color: '#BBBBBB' }}>Submit a daily report to see it here</p>
        </div>
      ) : (
        <div className="space-y-2 p-4">
          {reports.map((r) => (
            <button key={r.id} type="button" onClick={() => router.push(`/report/${r.id}`)}
              className="w-full bg-white rounded-xl px-4 py-3 text-left"
              style={{ border: '1px solid #EEEEEE' }}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold" style={{ color: '#111111' }}>{formatDate(r.report_date)}</p>
                  {r.zoneName && <p className="text-xs mt-0.5" style={{ color: '#666666' }}>{r.zoneName}</p>}
                </div>
                <StatusPill status={r.status} />
              </div>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-xs" style={{ color: '#666666' }}>{r.progress_pct}% progress</span>
                <span className="text-xs" style={{ color: '#666666' }}>{r.workers_count} workers</span>
                {r.photoCount > 0 && (
                  <span className="text-xs" style={{ color: '#666666' }}>{r.photoCount} photos</span>
                )}
              </div>
              {r.issues?.trim() && (
                <p className="text-xs mt-1.5 line-clamp-1" style={{ color: '#E24B4A' }}>{r.issues}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
