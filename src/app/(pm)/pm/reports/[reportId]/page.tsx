'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useReportDetail } from '@/hooks/useReportDetail'
import { formatDate, formatTime } from '@/lib/utils'
import PhotoGrid from '@/components/pm/reports/PhotoGrid'

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  submitted:  { bg: '#E4E9FA', text: '#00236F' },
  approved:   { bg: '#D1FAE5', text: '#065F46' },
  rejected:   { bg: '#FEE2E2', text: '#991B1B' },
  draft:      { bg: '#F3F4F6', text: '#374151' },
}

const TASK_COLOR: Record<string, string> = {
  done: '#00236F', in_progress: '#778EDE', not_started: '#BBBBBB', overdue: '#E24B4A',
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-shrink-0 rounded-full px-3 py-1.5" style={{ backgroundColor: '#F5F6FA', border: '1px solid #EEEEEE' }}>
      <span className="text-xs" style={{ color: '#666666' }}>{label}: </span>
      <span className="text-xs font-semibold" style={{ color: '#111111' }}>{value}</span>
    </div>
  )
}

export default function ReportDetailPage() {
  const { reportId } = useParams() as { reportId: string }
  const router = useRouter()
  const { report, tasks, loading, saveComment } = useReportDetail(reportId)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    if (!comment.trim() || saving) return
    setSaving(true)
    await saveComment(comment)
    setSaving(false)
    setSaved(true)
    setComment('')
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) {
    return (
      <div style={{ backgroundColor: '#F5F6FA', minHeight: '100vh', padding: '32px 20px' }}>
        <div className="px-4 py-5 md:px-8 md:py-8" style={{ maxWidth: '900px', margin: '0 auto' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl animate-pulse mb-3" style={{ height: '80px', backgroundColor: '#EEEEEE' }} />
          ))}
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div style={{ backgroundColor: '#F5F6FA', minHeight: '100vh', padding: '32px 20px' }}>
        <div className="px-4 py-5 md:px-8 md:py-8 text-center">
          <p style={{ color: '#666666' }}>Report not found.</p>
          <button type="button" onClick={() => router.push('/pm/reports')} className="mt-3 text-sm" style={{ color: '#00236F' }}>
            Back to reports
          </button>
        </div>
      </div>
    )
  }

  const statusStyle = STATUS_COLOR[report.status] ?? STATUS_COLOR.draft

  return (
    <div style={{ backgroundColor: '#F5F6FA', minHeight: '100vh', padding: '32px 20px' }}>
      <div className="px-4 py-5 md:px-8 md:py-8" style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button type="button" onClick={() => router.push('/pm/reports')} className="flex-shrink-0" style={{ color: '#666666' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="font-semibold" style={{ color: '#111111', fontSize: '20px' }}>Site Report</h1>
            <span className="text-xs font-semibold rounded-full px-2.5 py-1" style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}>
              {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
            </span>
          </div>
          <p className="text-sm truncate" style={{ color: '#666666' }}>
            {formatDate(report.report_date)} &middot; {report.projectName}
            {report.projectLocation ? ` · ${report.projectLocation}` : ''}
          </p>
        </div>
      </div>

      {/* Status pills row */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5" style={{ scrollbarWidth: 'none' }}>
        <Pill label="Engineer" value={`${report.engineerName} (${report.engineerRole})`} />
        <Pill label="Workers" value={String(report.workers_count)} />
        <Pill label="Progress" value={`${report.progress_pct}%`} />
        {report.submitted_at && <Pill label="Submitted" value={formatTime(report.submitted_at)} />}
        {report.zoneName && <Pill label="Zone" value={report.zoneName} />}
        {report.weather && <Pill label="Weather" value={report.weather} />}
      </div>

      {/* Photos */}
      <div className="bg-white rounded-xl p-5 mb-4" style={{ border: '1px solid #EEEEEE' }}>
        <p className="text-sm font-semibold mb-3" style={{ color: '#111111' }}>Photos</p>
        <PhotoGrid photos={report.photos} />
      </div>

      {/* Issues — left border card */}
      {report.issues && (
        <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: '#FFF8F8', borderLeft: '4px solid #E24B4A' }}>
          <p className="uppercase tracking-wider mb-2" style={{ color: '#E24B4A', fontSize: '11px', fontWeight: 700 }}>Issues reported</p>
          <p className="text-sm" style={{ color: '#111111' }}>{report.issues}</p>
        </div>
      )}

      {/* Notes */}
      {report.notes && (
        <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: '#F5F6FA', border: '1px solid #EEEEEE' }}>
          <p className="uppercase tracking-wider mb-2" style={{ color: '#666666', fontSize: '11px', fontWeight: 700 }}>Notes</p>
          <p className="text-sm" style={{ color: '#111111' }}>{report.notes}</p>
        </div>
      )}

      {/* Tasks */}
      {tasks.length > 0 && (
        <div className="bg-white rounded-xl p-5 mb-4" style={{ border: '1px solid #EEEEEE' }}>
          <p className="text-sm font-semibold mb-3" style={{ color: '#111111' }}>Tasks for this date</p>
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-2.5 py-2" style={{ borderBottom: '1px solid #EEEEEE' }}>
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: TASK_COLOR[t.status] ?? '#BBBBBB' }} />
              <p className="text-sm flex-1" style={{ color: '#111111' }}>{t.title}</p>
              <span className="text-xs capitalize" style={{ color: '#666666' }}>{t.status.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      )}

      {/* PM comment */}
      <div className="bg-white rounded-xl p-5 mb-4" style={{ border: '1px solid #EEEEEE' }}>
        <p className="text-sm font-semibold mb-1" style={{ color: '#111111' }}>PM Comment</p>
        <p className="text-xs mb-3" style={{ color: '#666666' }}>Engineer will receive a notification when you save.</p>
        {saved && (
          <div className="rounded-lg px-3 py-2 mb-3 text-sm" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
            Comment saved and engineer notified.
          </div>
        )}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder="Leave feedback for the engineer..."
          className="w-full px-3 py-2.5 text-sm rounded-lg outline-none resize-none mb-3"
          style={{ backgroundColor: '#F5F6FA', border: '1px solid #EEEEEE', color: '#111111' }}
        />
        <button type="button" onClick={handleSave} disabled={saving || !comment.trim()}
          className="px-5 py-2 text-sm font-semibold rounded-lg disabled:opacity-50 text-white"
          style={{ backgroundColor: '#00236F' }}>
          {saving ? 'Saving...' : 'Send comment'}
        </button>
      </div>

      {/* Report metadata */}
      <div className="rounded-xl px-4 py-3" style={{ backgroundColor: '#F5F6FA', border: '1px solid #EEEEEE' }}>
        <p className="uppercase tracking-wider mb-2" style={{ color: '#BBBBBB', fontSize: '11px', fontWeight: 700 }}>Report metadata</p>
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <p className="text-xs" style={{ color: '#666666' }}>ID: <span style={{ color: '#111111' }}>{report.id.slice(0, 8)}</span></p>
          <p className="text-xs" style={{ color: '#666666' }}>Date: <span style={{ color: '#111111' }}>{formatDate(report.report_date)}</span></p>
          {report.submitted_at && <p className="text-xs" style={{ color: '#666666' }}>Submitted: <span style={{ color: '#111111' }}>{formatTime(report.submitted_at)}</span></p>}
        </div>
      </div>
      </div>
    </div>
  )
}
