'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useProfile } from '@/hooks/useProfile'
import { useActiveProject } from '@/hooks/useActiveProject'
import { useProjectMembers } from '@/hooks/useProjectMembers'
import { useProjectTasks } from '@/hooks/useProjectTasks'
import { createClient } from '@/lib/supabase/client'
import { SkeletonStats, SkeletonTable } from '@/components/shared/Skeleton'

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    not_started: { label: 'Not started', bg: '#F5F6FA', color: '#BBBBBB' },
    in_progress: { label: 'Active', bg: '#00236F', color: '#FFFFFF' },
    done: { label: 'Done', bg: '#E4E9FA', color: '#00236F' },
    overdue: { label: 'Overdue', bg: '#FFF5F5', color: '#E24B4A' },
  }
  const s = map[status] ?? map.not_started
  return (
    <span className="text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0"
      style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>
  )
}

export default function ForemanDashboardPage() {
  const { profile, loading: profileLoading } = useProfile()
  const { project } = useActiveProject()
  const { members } = useProjectMembers(project?.id)
  const { tasks, loading: tasksLoading } = useProjectTasks(project?.id)
  const [present, setPresent] = useState(0)

  const engineers = members.filter((m) => m.role === 'engineer')
  const activeTasks = tasks.filter((t) => t.status !== 'done').slice(0, 5)

  useEffect(() => {
    if (!project?.id || !profile?.id) return
    const supabase = createClient()
    const todayStr = new Date().toISOString().slice(0, 10)
    supabase.from('daily_reports')
      .select('workers_count')
      .eq('project_id', project.id)
      .eq('engineer_id', profile.id)
      .gte('report_date', todayStr)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => { if (data) setPresent(Number(data.workers_count)) })
  }, [project?.id, profile?.id])

  if (profileLoading) {
    return (
      <div className="px-4 pt-6 md:px-8 md:pt-8">
        <SkeletonStats count={2} />
        <SkeletonTable rows={3} />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F6F8' }}>
      <div className="px-4 py-4 space-y-4">
        {/* Crew summary */}
        <div className="bg-white rounded-xl p-5" style={{ border: '0.5px solid #EEEEEE' }}>
          <p className="text-base font-semibold mb-4" style={{ color: '#111111' }}>Today's crew</p>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Present', value: present, color: '#00236F' },
              { label: 'Active tasks', value: activeTasks.length, color: '#778EDE' },
              { label: 'Team size', value: members.length, color: '#111111' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-bold" style={{ fontSize: '32px', color: s.color, lineHeight: 1 }}>{s.value}</p>
                <p className="text-xs mt-1" style={{ color: '#666666' }}>{s.label}</p>
              </div>
            ))}
          </div>
          <Link href="/foreman/crew" className="block w-full py-3 rounded-lg text-sm font-semibold text-center" style={{ border: '1px solid #00236F', color: '#00236F' }}>
            Update attendance
          </Link>
        </div>

        {/* Active tasks */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#BBBBBB' }}>Active tasks</p>
            <Link href="/foreman/tasks" className="text-xs font-semibold" style={{ color: '#00236F' }}>View all</Link>
          </div>
          {tasksLoading ? (
            <SkeletonTable rows={3} />
          ) : activeTasks.length === 0 ? (
            <div className="bg-white rounded-xl p-5 text-center" style={{ border: '0.5px solid #EEEEEE' }}>
              <p className="text-sm" style={{ color: '#BBBBBB' }}>No active tasks</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl overflow-hidden" style={{ border: '0.5px solid #EEEEEE' }}>
              {activeTasks.map((t, i) => (
                <div key={t.id} className={`flex items-center gap-3 px-4 py-3.5 ${i < activeTasks.length - 1 ? 'border-b' : ''}`} style={{ borderColor: '#EEEEEE' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#111111' }}>{t.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#BBBBBB' }}>{t.engineerName}</p>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <Link href="/foreman/log" className="block w-full py-4 rounded-xl text-sm font-semibold text-white text-center" style={{ backgroundColor: '#00236F' }}>
          Submit crew report
        </Link>
      </div>
    </div>
  )
}
