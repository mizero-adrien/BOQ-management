'use client'

export const dynamic = 'force-dynamic'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { useReportDetail } from '@/hooks/useReportDetail'
import { formatDate } from '@/lib/utils'
import PhotoGrid from '@/components/pm/reports/PhotoGrid'

interface Props {
  params: Promise<{ reportId: string }>
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    submitted: { bg: '#EDFAF5', color: '#5DCAA5' },
    draft: { bg: '#F5F6FA', color: '#666666' },
    rejected: { bg: '#FFF5F5', color: '#E24B4A' },
  }
  const s = map[status] ?? map.draft
  return (
    <span className="text-xs font-semibold px-3 py-1 rounded-full"
      style={{ backgroundColor: s.bg, color: s.color }}>
      {status}
    </span>
  )
}

export default function ForemanReportDetailPage({ params }: Props) {
  const { reportId } = use(params)
  const { report, tasks, loading } = useReportDetail(reportId)
  const router = useRouter()

  if (loading) {
    return (
      <div className="min-h-screen animate-pulse p-4" style={{ backgroundColor: '#F5F6FA' }}>
        <div className="h-5 w-32 rounded mb-4" style={{ backgroundColor: '#EEEEEE' }} />
        {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl mb-3" style={{ backgroundColor: '#EEEEEE' }} />)}
      </div>
    )
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm" style={{ color: '#666666' }}>Report not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-8" style={{ backgroundColor: '#F5F6FA' }}>
      <div className="bg-white border-b px-4 pt-12 pb-4" style={{ borderColor: '#EEEEEE' }}>
        <button type="button" onClick={() => router.back()}
          className="text-sm mb-3 block" style={{ color: '#666666' }}>
          Back
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold" style={{ color: '#111111' }}>
            {formatDate(report.report_date)}
          </h1>
          <StatusPill status={report.status} />
        </div>
        {report.zoneName && (
          <p className="text-sm mt-1" style={{ color: '#666666' }}>{report.zoneName}</p>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div className="bg-white rounded-xl p-4" style={{ border: '1px solid #EEEEEE' }}>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs mb-1" style={{ color: '#666666' }}>Workers</p>
              <p className="text-lg font-bold" style={{ color: '#111111' }}>{report.workers_count}</p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: '#666666' }}>Progress</p>
              <p className="text-lg font-bold" style={{ color: '#00236F' }}>{report.progress_pct}%</p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: '#666666' }}>Weather</p>
              <p className="text-lg font-bold" style={{ color: '#111111' }}>{report.weather ?? '-'}</p>
            </div>
          </div>
        </div>

        {report.notes && (
          <div className="bg-white rounded-xl p-4" style={{ border: '1px solid #EEEEEE' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: '#666666' }}>Notes</p>
            <p className="text-sm" style={{ color: '#111111' }}>{report.notes}</p>
          </div>
        )}

        {report.issues && (
          <div className="rounded-xl p-4" style={{ backgroundColor: '#FFF5F5', border: '1px solid #E24B4A' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: '#E24B4A' }}>Issues reported</p>
            <p className="text-sm" style={{ color: '#111111' }}>{report.issues}</p>
          </div>
        )}

        {report.photos.length > 0 && <PhotoGrid photos={report.photos} />}

        {tasks.length > 0 && (
          <div className="bg-white rounded-xl p-4" style={{ border: '1px solid #EEEEEE' }}>
            <p className="text-xs font-semibold mb-3" style={{ color: '#666666' }}>Tasks that day</p>
            {tasks.map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-2 border-b last:border-b-0" style={{ borderColor: '#EEEEEE' }}>
                <span className="text-sm flex-1" style={{ color: '#111111' }}>{t.title}</span>
                <span className="text-xs font-medium" style={{ color: t.status === 'done' ? '#5DCAA5' : '#EF9F27' }}>{t.status}</span>
              </div>
            ))}
          </div>
        )}

        {report.pm_comment && (
          <div className="bg-white rounded-xl p-4" style={{ border: '1px solid #778EDE' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: '#778EDE' }}>PM comment</p>
            <p className="text-sm" style={{ color: '#111111' }}>{report.pm_comment}</p>
          </div>
        )}
      </div>
    </div>
  )
}
