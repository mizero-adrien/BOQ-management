'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils/index'

interface ReportRow {
  id: string
  report_date: string
  engineer_id: string
  engineerName: string
  workers_count: number
  progress_pct: number
  issues: string | null
  status: string
}

export default function OwnerReportsPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const router = useRouter()
  const [reports, setReports] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('daily_reports').select('*').eq('project_id', projectId)
      .eq('status', 'submitted').order('report_date', { ascending: false })
      .then(async ({ data }) => {
        if (!data) { setLoading(false); return }
        const engineerIds = [...new Set(data.map((r) => r.engineer_id as string))]
        const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', engineerIds)
        const pMap = new Map((profiles ?? []).map((p) => [p.id as string, p.full_name as string]))
        setReports(data.map((r) => ({
          id: r.id as string, report_date: r.report_date as string,
          engineer_id: r.engineer_id as string,
          engineerName: pMap.get(r.engineer_id as string) ?? 'Unknown',
          workers_count: Number(r.workers_count), progress_pct: Number(r.progress_pct),
          issues: r.issues as string | null, status: r.status as string,
        })))
        setLoading(false)
      })
  }, [projectId])

  return (
    <div className="px-4 py-5 md:px-8 md:py-8" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 className="text-xl font-semibold mb-5" style={{ color: '#111111' }}>Daily Reports</h1>
      {loading ? (
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl" style={{ backgroundColor: '#EEEEEE' }} />)}
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center" style={{ border: '0.5px solid #EEEEEE' }}>
          <p className="text-sm" style={{ color: '#BBBBBB' }}>No submitted reports yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: '0.5px solid #EEEEEE' }}>
          {reports.map((r, i) => (
            <button
              key={r.id}
              type="button"
              onClick={() => router.push(`/owner/${projectId}/reports/${r.id}`)}
              className="w-full flex items-center gap-4 px-4 py-4 text-left"
              style={{
                borderBottom: i < reports.length - 1 ? '1px solid #EEEEEE' : 'none',
                background: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F5F6FA' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '' }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold" style={{ color: '#111111' }}>{formatDate(r.report_date)}</p>
                  {r.issues && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#E24B4A' }} />}
                </div>
                <p className="text-xs" style={{ color: '#666666' }}>{r.engineerName}</p>
              </div>
              <div className="flex gap-4 flex-shrink-0 text-right">
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#00236F' }}>{r.workers_count}</p>
                  <p className="text-xs" style={{ color: '#BBBBBB' }}>workers</p>
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#00236F' }}>{r.progress_pct}%</p>
                  <p className="text-xs" style={{ color: '#BBBBBB' }}>progress</p>
                </div>
                <div className="flex items-center" style={{ color: '#BBBBBB' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
