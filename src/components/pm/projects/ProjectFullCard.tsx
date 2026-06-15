'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Project, ProjectStatus } from '@/types/database'
import { formatDate } from '@/lib/utils'
import StatBadge from '@/components/pm/StatBadge'

function StatusBadge({ status }: { status: ProjectStatus }) {
  if (status === 'active') return <span className="text-xs font-medium px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: '#00236F' }}>Active</span>
  if (status === 'completed') return <span className="text-xs font-medium px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: '#111111' }}>Completed</span>
  return <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ color: '#666666', border: '1px solid #EEEEEE' }}>On hold</span>
}

function PersonIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> }
function DocIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> }
function AlertIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> }

function getWeekStart(): string {
  const d = new Date()
  const day = d.getDay()
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
  return d.toISOString().split('T')[0]
}

export default function ProjectFullCard({ project }: { project: Project }) {
  const router = useRouter()
  const [teamCount, setTeamCount] = useState(0)
  const [reportsThisWeek, setReportsThisWeek] = useState(0)
  const [openIssues, setOpenIssues] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    const weekStart = getWeekStart()
    Promise.all([
      supabase.from('project_members').select('*', { count: 'exact', head: true }).eq('project_id', project.id),
      supabase.from('daily_reports').select('*', { count: 'exact', head: true }).eq('project_id', project.id).gte('report_date', weekStart).eq('status', 'submitted'),
      supabase.from('daily_reports').select('id').eq('project_id', project.id).not('issues', 'is', null).neq('issues', ''),
    ]).then(([m, r, i]) => {
      setTeamCount(m.count ?? 0)
      setReportsThisWeek(r.count ?? 0)
      setOpenIssues((i.data ?? []).length)
    })
  }, [project.id])

  function handleShare(e: React.MouseEvent) {
    e.stopPropagation()
    const url = `${window.location.origin}/owner/${project.share_token}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #EEEEEE' }}>
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold mb-1 truncate" style={{ color: '#111111', fontSize: '18px' }}>{project.name}</p>
          <p className="text-sm mb-0.5 truncate" style={{ color: '#666666' }}>{project.client_name}</p>
          <p className="truncate" style={{ color: '#BBBBBB', fontSize: '13px' }}>{project.location}</p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      <div className="mb-1 rounded-full" style={{ height: '8px', backgroundColor: '#EEEEEE' }}>
        <div className="h-full rounded-full" style={{ width: `${project.overall_progress}%`, backgroundColor: '#00236F' }} />
      </div>
      <p className="text-xs mb-3" style={{ color: '#666666' }}>{project.overall_progress}% complete</p>

      <div className="flex items-center gap-4 mb-3">
        <StatBadge icon={<PersonIcon />} value={teamCount} label="members" />
        <StatBadge icon={<DocIcon />} value={reportsThisWeek} label="reports" />
        <StatBadge icon={<AlertIcon />} value={openIssues} label="issues" />
      </div>

      <p className="text-xs pt-3" style={{ color: '#BBBBBB', borderTop: '1px solid #EEEEEE' }}>
        {formatDate(project.start_date)} — {formatDate(project.expected_end_date)}
      </p>

      <div className="flex flex-col gap-2 mt-4">
        <button type="button" onClick={() => router.push(`/pm/projects/${project.id}`)}
          className="w-full py-2 rounded-lg text-sm font-medium"
          style={{ border: '1px solid #00236F', color: '#00236F' }}>
          View project
        </button>
        <button type="button" onClick={handleShare}
          className="w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5"
          style={{ border: '1px solid #EEEEEE', color: copied ? '#00236F' : '#666666' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          {copied ? 'Link copied' : 'Share owner link'}
        </button>
      </div>
    </div>
  )
}
