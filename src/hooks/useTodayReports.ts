'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { DailyReport, Project } from '@/types/database'

export interface ReportWithEngineer extends DailyReport {
  engineerName: string
  projectName: string
}

type RawReportRow = DailyReport & {
  engineer: { full_name: string } | null
}

export function useTodayReports(projects: Project[]) {
  const [reports, setReports] = useState<ReportWithEngineer[]>([])
  const [totalEngineers, setTotalEngineers] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (projects.length === 0) {
      setReports([])
      setLoading(false)
      return
    }

    const supabase = createClient()
    let cancelled = false
    const projectIds = projects.map((p) => p.id)

    const timeout = setTimeout(() => {
      if (!cancelled) {
        console.error('Today reports error: timed out after 8 seconds')
        setLoading(false)
      }
    }, 8000)

    async function fetchReports() {
      setLoading(true)
      try {
        const today = new Date().toISOString().split('T')[0]

        const { data, error } = await supabase
          .from('daily_reports')
          .select('*, engineer:profiles!engineer_id(full_name)')
          .in('project_id', projectIds)
          .eq('report_date', today)
          .order('submitted_at', { ascending: false })

        if (error) {
          console.error('Today reports error: fetch failed:', error.message)
          return
        }

        const { count, error: countError } = await supabase
          .from('project_members')
          .select('*', { count: 'exact', head: true })
          .in('project_id', projectIds)

        if (countError) {
          console.error('Today reports error: member count failed:', countError.message)
        }

        if (!cancelled) {
          const mapped: ReportWithEngineer[] = (data as unknown as RawReportRow[]).map((row) => {
            const { engineer, ...reportData } = row
            const project = projects.find((p) => p.id === row.project_id)
            return {
              ...reportData,
              engineerName: engineer?.full_name ?? 'Unknown',
              projectName: project?.name ?? '',
            }
          })
          setReports(mapped)
          setTotalEngineers(count ?? 0)
        }
      } catch (err) {
        console.error('Today reports error: unexpected error:', err)
      } finally {
        if (!cancelled) {
          clearTimeout(timeout)
          setLoading(false)
        }
      }
    }

    fetchReports()

    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [projects])

  return { reports, totalEngineers, loading }
}
