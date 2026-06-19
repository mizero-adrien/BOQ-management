'use client'

export const dynamic = 'force-dynamic'

import { useParams, useRouter } from 'next/navigation'
import { useReportDetail } from '@/hooks/useReportDetail'
import { formatDate } from '@/lib/utils'
import PhotoGrid from '@/components/pm/reports/PhotoGrid'

export default function OwnerReportDetailPage() {
  const params = useParams()
  const reportId = params.reportId as string
  const { report, tasks, loading } = useReportDetail(reportId)
  const router = useRouter()

  if (loading) {
    return (
      <div className="px-4 py-5 md:px-8 md:py-8" style={{ maxWidth: '800px', margin: '0 auto' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl animate-pulse mb-3" style={{ backgroundColor: '#EEEEEE' }} />
        ))}
      </div>
    )
  }

  if (!report) {
    return (
      <div className="px-4 py-5 text-center" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <p className="text-sm" style={{ color: '#666666' }}>Report not found</p>
        <button type="button" onClick={() => router.back()}
          className="mt-3 text-sm" style={{ color: '#00236F', background: 'none', border: 'none', cursor: 'pointer' }}>
          Go back
        </button>
      </div>
    )
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-8" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm mb-5"
        style={{ color: '#666666', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back to reports
      </button>

      <div className="bg-white rounded-xl p-5 mb-4" style={{ border: '1px solid #EEEEEE' }}>
        <h1 className="text-xl font-semibold mb-1" style={{ color: '#111111' }}>
          {formatDate(report.report_date)}
        </h1>
        <div className="flex flex-wrap gap-4 mt-3">
          <div>
            <p className="text-xs mb-0.5" style={{ color: '#666666' }}>Engineer</p>
            <p className="text-sm font-medium" style={{ color: '#111111' }}>{report.engineerName}</p>
          </div>
          <div>
            <p className="text-xs mb-0.5" style={{ color: '#666666' }}>Workers</p>
            <p className="text-sm font-medium" style={{ color: '#111111' }}>{report.workers_count}</p>
          </div>
          <div>
            <p className="text-xs mb-0.5" style={{ color: '#666666' }}>Progress</p>
            <p className="text-sm font-medium" style={{ color: '#00236F' }}>{report.progress_pct}%</p>
          </div>
          {report.weather && (
            <div>
              <p className="text-xs mb-0.5" style={{ color: '#666666' }}>Weather</p>
              <p className="text-sm font-medium" style={{ color: '#111111' }}>{report.weather}</p>
            </div>
          )}
          {report.zoneName && (
            <div>
              <p className="text-xs mb-0.5" style={{ color: '#666666' }}>Zone</p>
              <p className="text-sm font-medium" style={{ color: '#111111' }}>{report.zoneName}</p>
            </div>
          )}
        </div>
      </div>

      {report.issues && (
        <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: '#FFF8F8', borderLeft: '4px solid #E24B4A' }}>
          <p className="uppercase tracking-wider mb-2" style={{ color: '#E24B4A', fontSize: '11px', fontWeight: 700 }}>
            Issues reported
          </p>
          <p className="text-sm" style={{ color: '#111111' }}>{report.issues}</p>
        </div>
      )}

      {report.notes && (
        <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: '#F5F6FA', border: '1px solid #EEEEEE' }}>
          <p className="uppercase tracking-wider mb-2" style={{ color: '#666666', fontSize: '11px', fontWeight: 700 }}>
            Notes
          </p>
          <p className="text-sm" style={{ color: '#111111' }}>{report.notes}</p>
        </div>
      )}

      {report.photos.length > 0 && (
        <div className="bg-white rounded-xl p-5 mb-4" style={{ border: '1px solid #EEEEEE' }}>
          <p className="text-sm font-semibold mb-3" style={{ color: '#111111' }}>Photos</p>
          <PhotoGrid photos={report.photos} />
        </div>
      )}

      {tasks.length > 0 && (
        <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #EEEEEE' }}>
          <p className="text-sm font-semibold mb-3" style={{ color: '#111111' }}>Tasks that day</p>
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-3 py-2 border-b last:border-b-0" style={{ borderColor: '#EEEEEE' }}>
              <span className="text-sm flex-1" style={{ color: '#111111' }}>{t.title}</span>
              <span className="text-xs font-medium capitalize" style={{ color: t.status === 'done' ? '#5DCAA5' : '#EF9F27' }}>
                {t.status.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
