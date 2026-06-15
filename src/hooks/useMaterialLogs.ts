'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface MaterialLogEntry {
  id: string
  boqItemId: string
  itemDescription: string
  unit: string
  quantityUsed: number
  costRwf: number
  loggedAt: string
  engineerName: string
  reportId: string | null
}

export function useMaterialLogs(projectId: string | undefined) {
  const [logs, setLogs] = useState<MaterialLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) {
      setLoading(false)
      return
    }

    let cancelled = false
    const timeout = setTimeout(() => {
      if (!cancelled) setLoading(false)
    }, 8000)

    async function fetchLogs() {
      const supabase = createClient()
      try {
        // Step 1: Get all boq_item ids for the project
        const { data: sections } = await supabase
          .from('boq_sections')
          .select('boq_items(id, description, unit)')
          .eq('project_id', projectId)

        if (!sections || cancelled) return

        type ItemInfo = { id: string; description: string; unit: string }
        const allItems: ItemInfo[] = sections.flatMap(
          (s) => (s.boq_items as ItemInfo[]) ?? []
        )
        const itemIds = allItems.map((i) => i.id)
        const itemMap = new Map(allItems.map((i) => [i.id, i]))

        if (itemIds.length === 0) {
          if (!cancelled) { setLogs([]); setLoading(false) }
          return
        }

        // Step 2: Get material_logs for those items
        const { data: rawLogs } = await supabase
          .from('material_logs')
          .select('*')
          .in('boq_item_id', itemIds)
          .order('logged_at', { ascending: false })
          .limit(100)

        if (!rawLogs || cancelled) return

        // Step 3: Resolve engineer names via daily_reports
        const reportIds = [...new Set(
          rawLogs.filter((l) => l.report_id).map((l) => l.report_id as string)
        )]
        const engineerMap = new Map<string, string>()

        if (reportIds.length > 0) {
          const { data: reports } = await supabase
            .from('daily_reports')
            .select('id, engineer_id')
            .in('id', reportIds)

          if (reports) {
            const engIds = [...new Set(reports.map((r) => r.engineer_id as string))]
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, full_name')
              .in('id', engIds)
            const pMap = new Map((profiles ?? []).map((p) => [p.id as string, p.full_name as string]))
            for (const r of reports) {
              engineerMap.set(r.id as string, pMap.get(r.engineer_id as string) ?? 'Unknown')
            }
          }
        }

        if (!cancelled) {
          setLogs(
            rawLogs.map((l) => ({
              id: l.id as string,
              boqItemId: l.boq_item_id as string,
              itemDescription: itemMap.get(l.boq_item_id as string)?.description ?? '',
              unit: itemMap.get(l.boq_item_id as string)?.unit ?? '',
              quantityUsed: Number(l.quantity_used),
              costRwf: Number(l.cost_rwf),
              loggedAt: l.logged_at as string,
              engineerName: l.report_id ? (engineerMap.get(l.report_id as string) ?? 'Store') : 'Store',
              reportId: l.report_id as string | null,
            }))
          )
        }
      } catch (err) {
        console.error('useMaterialLogs error:', err)
      } finally {
        if (!cancelled) {
          clearTimeout(timeout)
          setLoading(false)
        }
      }
    }

    fetchLogs()
    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [projectId])

  return { logs, loading }
}
