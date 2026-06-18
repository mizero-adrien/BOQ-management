'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { DailyReport, ReportPhoto, Task, UserRole } from '@/types/database'

export interface ReportDetail extends DailyReport {
  engineerName: string
  engineerRole: UserRole
  projectName: string
  projectLocation: string | null
  zoneName: string | null
  photos: ReportPhoto[]
  tasks: Pick<Task, 'id' | 'title' | 'status'>[]
}

type RawDetail = DailyReport & {
  engineer: { id: string; full_name: string; role: UserRole } | null
  project: { name: string; location: string | null } | null
  zone: { name: string } | null
  photos: ReportPhoto[]
}

export function useReportDetail(reportId: string) {
  const [report, setReport] = useState<ReportDetail | null>(null)
  const [tasks, setTasks] = useState<Pick<Task, 'id' | 'title' | 'status'>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!reportId) return
    let cancelled = false
    setLoading(true)

    async function load() {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('daily_reports')
        .select(`
          *,
          engineer:profiles!daily_reports_engineer_id_fkey(id, full_name, role),
          project:projects!daily_reports_project_id_fkey(name, location),
          zone:plan_zones!daily_reports_zone_id_fkey(name),
          photos:report_photos(*)
        `)
        .eq('id', reportId)
        .single()

      if (error || !data) {
        console.error('useReportDetail:', error?.message)
        if (!cancelled) setLoading(false)
        return
      }
      if (cancelled) return

      const raw = data as unknown as RawDetail
      const detail: ReportDetail = {
        ...raw,
        engineerName: raw.engineer?.full_name ?? 'Unknown',
        engineerRole: (raw.engineer?.role ?? 'engineer') as UserRole,
        projectName: raw.project?.name ?? '',
        projectLocation: raw.project?.location ?? null,
        zoneName: raw.zone?.name ?? null,
        photos: raw.photos ?? [],
        tasks: [],
      }

      const { data: taskData } = await supabase
        .from('tasks')
        .select('id, title, status')
        .eq('assigned_to', raw.engineer_id)
        .eq('due_date', raw.report_date)

      if (!cancelled) {
        detail.tasks = (taskData ?? []) as Pick<Task, 'id' | 'title' | 'status'>[]
        setReport(detail)
        setTasks(detail.tasks)
        setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [reportId])

  async function saveComment(comment: string) {
    if (!report) return
    const supabase = createClient()
    await supabase
      .from('daily_reports')
      .update({ pm_comment: comment } as Record<string, string>)
      .eq('id', reportId)
    await supabase.from('notifications').insert({
      user_id: report.engineer_id,
      project_id: report.project_id,
      type: 'comment_added',
      title: 'PM commented on your report',
      body: comment.slice(0, 100),
      read: false,
      action_url: `/report/${reportId}`,
    })
  }

  return { report, tasks, loading, saveComment }
}
