'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface OwnerBOQSection {
  section_id: string
  section_title: string
  order_index: number
  status: string
  total_budgeted: number
  total_used: number
  usage_pct: number
}

export function useOwnerBOQSummary(projectId: string | undefined) {
  const [sections, setSections] = useState<OwnerBOQSection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) { setLoading(false); return }
    let cancelled = false
    setLoading(true)

    async function load() {
      const supabase = createClient()

      const { data: sectionsData, error: sectionsError } = await supabase
        .from('boq_sections')
        .select('id, title, order_index, status')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true })

      if (cancelled) return
      if (sectionsError || !sectionsData) { setLoading(false); return }

      const summaries: OwnerBOQSection[] = []

      for (const section of sectionsData) {
        if (cancelled) break

        const { data: items } = await supabase
          .from('boq_items')
          .select('budgeted_total, used_total')
          .eq('section_id', section.id as string)

        const itemList = items ?? []
        const total_budgeted = itemList.reduce((sum, i) => sum + (Number(i.budgeted_total) || 0), 0)
        const total_used = itemList.reduce((sum, i) => sum + (Number(i.used_total) || 0), 0)
        const usage_pct = total_budgeted > 0
          ? Math.round((total_used / total_budgeted) * 100 * 10) / 10
          : 0

        summaries.push({
          section_id: section.id as string,
          section_title: section.title as string,
          order_index: section.order_index as number,
          status: section.status as string,
          total_budgeted,
          total_used,
          usage_pct,
        })
      }

      if (!cancelled) {
        setSections(summaries)
        setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [projectId])

  return { sections, loading }
}
