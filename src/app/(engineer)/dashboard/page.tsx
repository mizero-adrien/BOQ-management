'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { useActiveProject } from '@/hooks/useActiveProject'
import { useTodayTasks } from '@/hooks/useTodayTasks'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import ReportDueBanner from '@/components/engineer/ReportDueBanner'
import DashboardStatCard from '@/components/engineer/DashboardStatCard'
import TaskItem from '@/components/engineer/TaskItem'
import { DashboardSkeleton, TasksSkeleton } from '@/components/engineer/DashboardSkeleton'

export default function DashboardPage() {
  const { profile, loading: profileLoading } = useProfile()
  const { project } = useActiveProject()
  const { tasks, loading: tasksLoading } = useTodayTasks(profile?.id)

  const [boqStats, setBoqStats] = useState({ active: 0, total: 0 })
  const [workersYesterday, setWorkersYesterday] = useState<number | null>(null)

  useEffect(() => {
    if (!project?.id || !profile?.id) return
    const supabase = createClient()

    async function fetchStats() {
      const { data: sections } = await supabase
        .from('boq_sections')
        .select('status')
        .eq('project_id', project!.id)

      if (sections) {
        setBoqStats({
          total: sections.length,
          active: sections.filter((s: { status: string }) => s.status !== 'done').length,
        })
      }

      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().slice(0, 10)

      const { data: report } = await supabase
        .from('daily_reports')
        .select('workers_count')
        .eq('project_id', project!.id)
        .eq('engineer_id', profile!.id)
        .eq('report_date', yesterdayStr)
        .maybeSingle()

      setWorkersYesterday(report?.workers_count ?? null)
    }

    fetchStats()
  }, [project?.id, profile?.id])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const initials = (profile?.full_name ?? '')
    .split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
  const today = formatDate(new Date().toISOString())

  if (profileLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F6FA' }}>
      <div className="bg-white px-4 pt-4 pb-4 border-b" style={{ borderColor: '#EEEEEE' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#BBBBBB' }}>
              {today}
            </p>
            <h1 className="text-lg font-semibold mt-0.5" style={{ color: '#111111' }}>
              {greeting}, {firstName}
            </h1>
          </div>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center md:hidden"
            style={{ backgroundColor: '#E4E9FA' }}
          >
            <span className="text-xs font-bold" style={{ color: '#00236F' }}>{initials}</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        <ReportDueBanner />

        <div className="grid grid-cols-2 gap-3">
          <DashboardStatCard
            label="Active BOQ sections"
            value={String(boqStats.active)}
            sublabel={boqStats.total > 0 ? `of ${boqStats.total} total` : 'no sections yet'}
          />
          <DashboardStatCard
            label="Workers logged"
            value={workersYesterday !== null ? String(workersYesterday) : '—'}
            sublabel="yesterday"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#BBBBBB' }}>
              Tasks due today
            </h2>
            <Link href="/tasks" className="text-xs font-semibold" style={{ color: '#00236F' }}>
              View all
            </Link>
          </div>

          {tasksLoading ? (
            <TasksSkeleton />
          ) : tasks.length === 0 ? (
            <div className="bg-white rounded-xl p-5 text-center border" style={{ borderColor: '#EEEEEE' }}>
              <p className="text-sm font-medium" style={{ color: '#111111' }}>No tasks due today</p>
              <p className="text-xs mt-1" style={{ color: '#BBBBBB' }}>
                Your project manager has not assigned any tasks yet. If you loaded the demo project, check your Tasks tab.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#EEEEEE' }}>
              {tasks.map((task, index) => (
                <TaskItem key={task.id} task={task} isLast={index === tasks.length - 1} />
              ))}
            </div>
          )}
        </div>

        <Link
          href="/report/new"
          className="block w-full py-4 rounded-xl text-sm font-semibold text-white text-center transition-opacity active:opacity-80"
          style={{ backgroundColor: '#00236F' }}
        >
          Submit today's report
        </Link>
      </div>
    </div>
  )
}
