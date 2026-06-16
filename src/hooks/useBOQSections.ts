'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { BOQSection, BOQItemView } from '@/types/database'

export interface SectionWithItems extends BOQSection {
  items: BOQItemView[]
  total_budgeted: number
  total_used: number
  usage_pct: number
  hasFinancials: boolean
}

export function useBOQSections(projectId: string | undefined) {
  const [sections, setSections] = useState<SectionWithItems[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) { setLoading(false); return }

    let cancelled = false

    const timeout = setTimeout(() => {
      if (!cancelled) {
        console.error('BOQ sections error: timed out after 8 seconds')
        setLoading(false)
      }
    }, 8000)

    async function fetchSections() {
      const supabase = createClient()
      try {
        const { data: sectionsData, error } = await supabase
          .from('boq_sections')
          .select('id, title, order_index, status, project_id, created_at')
          .eq('project_id', projectId)
          .order('order_index', { ascending: true })

        if (error) { console.error('BOQ sections error:', error.message); return }
        if (!sectionsData || sectionsData.length === 0) {
          if (!cancelled) setSections([])
          return
        }

        const itemsResults = await Promise.all(
          sectionsData.map((s) =>
            supabase
              .rpc('get_boq_items_for_role', { p_section_id: s.id })
              .then(({ data }) => ({ id: s.id, items: (data ?? []) as BOQItemView[] }))
          )
        )

        const itemsMap = Object.fromEntries(itemsResults.map(({ id, items }) => [id, items]))

        const result: SectionWithItems[] = sectionsData.map((section) => {
          const items: BOQItemView[] = itemsMap[section.id] ?? []
          const total_budgeted = items.reduce((sum: number, i: BOQItemView) => sum + (i.budgeted_total ?? 0), 0)
          const total_used = items.reduce((sum: number, i: BOQItemView) => sum + (i.used_total ?? 0), 0)
          const usage_pct = total_budgeted > 0
            ? Math.round((total_used / total_budgeted) * 1000) / 10
            : 0
          const hasFinancials = items.some((i) => i.unit_rate !== null)
          return { ...section, items, total_budgeted, total_used, usage_pct, hasFinancials }
        })

        if (!cancelled) setSections(result)
      } catch (err) {
        console.error('BOQ sections error: unexpected error:', err)
      } finally {
        if (!cancelled) { clearTimeout(timeout); setLoading(false) }
      }
    }

    fetchSections()
    return () => { cancelled = true; clearTimeout(timeout) }
  }, [projectId])

  return { sections, loading }
}
