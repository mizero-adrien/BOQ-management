'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { DailyReport, Project, UserRole, ReportStatus } from '@/types/database'

export interface ReportListItem extends DailyReport {
  engineerName: string
  engineerRole: UserRole
  projectName: string
}

type RawRow = DailyReport & {
  engineer: { full_name: string; role: UserRole } | null
  project: { name: string } | null
}

export function usePMReports(
  projects: Project[],
  projectId: string,
  dateFrom: string,
  dateTo: string,
  status: '' | ReportStatus,
  searchTerm: string
) {
  const [reports, setReports] = useState<ReportListItem[]>([])
  const [loading, setLoading] = useState(true)

  const projectIdsKey = projects.map((p) => p.id).join(',')

  useEffect(() => {
    if (projects.length === 0) {
      setReports([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    async function load() {
      const supabase = createClient()
      const allIds = projects.map((p) => p.id)
      const targetIds = projectId ? [projectId] : allIds

      const { data, error } = await supabase
        .from('daily_reports')
        .select('*, engineer:profiles!engineer_id(full_name, role), project:projects!project_id(name)')
        .in('project_id', targetIds)
        .gte('report_date', dateFrom)
        .lte('report_date', dateTo)
        .order('submitted_at', { ascending: false })

      if (error) {
        console.error('usePMReports: fetch error:', error.message)
        if (!cancelled) setLoading(false)
        return
      }
      if (cancelled) return

      const rows = (data as unknown as RawRow[]).map((row) => {
        const { engineer, project: proj, ...rest } = row
        return {
          ...rest,
          engineerName: engineer?.full_name ?? 'Unknown',
          engineerRole: (engineer?.role ?? 'engineer') as UserRole,
          projectName: proj?.name ?? '',
        }
      })

      let filtered = rows
      if (status) filtered = filtered.filter((r) => r.status === status)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase()
        filtered = filtered.filter((r) => r.engineerName.toLowerCase().includes(q))
      }

      setReports(filtered)
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectIdsKey, projectId, dateFrom, dateTo, status, searchTerm])

  return { reports, loading }
}
