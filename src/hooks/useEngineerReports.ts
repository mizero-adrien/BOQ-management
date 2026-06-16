'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { DailyReport } from '@/types/database'

export interface EngineerReport extends Pick<DailyReport, 'id' | 'report_date' | 'workers_count' | 'progress_pct' | 'issues' | 'status'> {
  zoneName: string | null
  photoCount: number
}

type RawReport = {
  id: string
  report_date: string
  workers_count: number
  progress_pct: number
  issues: string | null
  status: string
  zone: { name: string } | null
  photos: { id: string }[]
}

export function useEngineerReports(month?: string) {
  const [reports, setReports] = useState<EngineerReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (!cancelled) setLoading(false)
        return
      }

      let query = supabase
        .from('daily_reports')
        .select('id, report_date, workers_count, progress_pct, issues, status, zone:plan_zones(name), photos:report_photos(id)')
        .eq('engineer_id', user.id)
        .order('report_date', { ascending: false })

      if (month) {
        query = query.gte('report_date', `${month}-01`).lte('report_date', `${month}-31`)
      }

      const { data } = await query
      if (cancelled) return

      setReports(
        ((data ?? []) as unknown as RawReport[]).map((r) => ({
          id: r.id,
          report_date: r.report_date,
          workers_count: r.workers_count,
          progress_pct: r.progress_pct,
          issues: r.issues,
          status: r.status as DailyReport['status'],
          zoneName: r.zone?.name ?? null,
          photoCount: r.photos?.length ?? 0,
        }))
      )
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [month])

  return { reports, loading }
}
