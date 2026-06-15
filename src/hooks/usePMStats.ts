'use client'

import { useMemo } from 'react'
import type { Project } from '@/types/database'
import type { ReportWithEngineer } from './useTodayReports'

interface PMStats {
  activeProjects: number
  reportsToday: { submitted: number; total: number }
  totalWorkers: number
  openIssues: number
}

export function usePMStats(
  projects: Project[],
  todayReports: ReportWithEngineer[],
  totalEngineers: number
): PMStats {
  return useMemo(() => {
    const activeProjects = projects.filter((p) => p.status === 'active').length

    const totalWorkers = todayReports.reduce(
      (sum, r) => sum + r.workers_count,
      0
    )

    const openIssues = todayReports.filter(
      (r) => r.issues && r.issues.trim() !== ''
    ).length

    return {
      activeProjects,
      reportsToday: { submitted: todayReports.length, total: totalEngineers },
      totalWorkers,
      openIssues,
    }
  }, [projects, todayReports, totalEngineers])
}
