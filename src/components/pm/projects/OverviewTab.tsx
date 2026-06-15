'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { ProjectDetail } from '@/hooks/useProjectDetail'
import type { Project } from '@/types/database'
import { formatDate } from '@/lib/utils'
import ProjectInfoCard from './ProjectInfoCard'

interface RecentReport {
  id: string; report_date: string; workers_count: number; progress_pct: number
  issues: string | null; engineerName: string
}
type RawR = { id: string; report_date: string; workers_count: number; progress_pct: number; issues: string | null; engineer: { full_name: string } | null }

interface Props {
  project: ProjectDetail
  onUpdate: (updates: Partial<Pick<Project, 'name' | 'location' | 'client_name' | 'start_date' | 'expected_end_date' | 'status' | 'overall_progress' | 'plan_image_url'>>) => Promise<void>
}

export default function OverviewTab({ project, onUpdate }: Props) {
  const [recent, setRecent] = useState<RecentReport[]>([])
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.from('daily_reports')
      .select('id, report_date, workers_count, progress_pct, issues, engineer:profiles!engineer_id(full_name)')
      .eq('project_id', project.id).eq('status', 'submitted')
      .order('submitted_at', { ascending: false }).limit(5)
      .then(({ data }) => {
        if (data) setRecent((data as unknown as RawR[]).map((r) => ({
          id: r.id, report_date: r.report_date, workers_count: r.workers_count,
          progress_pct: r.progress_pct, issues: r.issues, engineerName: r.engineer?.full_name ?? 'Unknown',
        })))
      })
  }, [project.id])

  const openIssues = recent.filter((r) => !!r.issues?.trim())

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <ProjectInfoCard project={project} onUpdate={onUpdate} />
        <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #EEEEEE' }}>
          <p className="text-sm font-semibold mb-3" style={{ color: '#111111' }}>Progress</p>
          <p style={{ color: '#00236F', fontSize: '40px', fontWeight: 700, lineHeight: 1 }}>{project.overall_progress}%</p>
          <div className="mt-3 mb-2 rounded-full" style={{ height: '8px', backgroundColor: '#EEEEEE' }}>
            <div className="h-full rounded-full" style={{ width: `${project.overall_progress}%`, backgroundColor: '#00236F' }} />
          </div>
          <p className="text-xs" style={{ color: '#666666' }}>{project.reportsThisWeek} reports this week</p>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold mb-3" style={{ color: '#111111' }}>Recent reports</p>
        {recent.length === 0 ? (
          <p className="text-sm mb-6" style={{ color: '#BBBBBB' }}>No submitted reports yet</p>
        ) : (
          <div className="mb-6">
            {recent.map((r) => (
              <div key={r.id} onClick={() => router.push(`/pm/reports/${r.id}`)}
                className="bg-white rounded-xl px-4 py-3 mb-2 cursor-pointer"
                style={{ border: '1px solid #EEEEEE' }}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium" style={{ color: '#111111' }}>{r.engineerName}</p>
                  <span className="text-xs font-medium" style={{ color: '#00236F' }}>{r.progress_pct}%</span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: '#666666' }}>{formatDate(r.report_date)} · {r.workers_count} workers</p>
              </div>
            ))}
          </div>
        )}
        {openIssues.length > 0 && (
          <>
            <p className="text-sm font-semibold mb-3" style={{ color: '#111111' }}>Open issues</p>
            {openIssues.map((r) => (
              <div key={r.id} onClick={() => router.push(`/pm/reports/${r.id}`)}
                className="rounded-xl px-4 py-3 mb-2 cursor-pointer"
                style={{ backgroundColor: '#FFF5F5', border: '1px solid #E24B4A' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: '#E24B4A' }}>Issues reported</p>
                <p className="text-sm line-clamp-2" style={{ color: '#111111' }}>{r.issues}</p>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
