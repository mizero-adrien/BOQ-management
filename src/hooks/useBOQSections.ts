'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { BOQSection, BOQItem } from '@/types/database'

export interface SectionWithItems extends BOQSection {
  items: BOQItem[]
  total_budgeted: number
  total_used: number
  usage_pct: number
}

export function useBOQSections(projectId: string | undefined) {
  const [sections, setSections] = useState<SectionWithItems[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) {
      setLoading(false)
      return
    }

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
        const { data, error } = await supabase
          .from('boq_sections')
          .select('*, boq_items(*)')
          .eq('project_id', projectId)
          .order('order_index', { ascending: true })

        if (error) {
          console.error('BOQ sections error:', error.message)
          return
        }

        if (!data || data.length === 0) {
          if (!cancelled) {
            setSections([])
          }
          return
        }

        const sectionsWithItems = (data as (BOQSection & { boq_items: BOQItem[] })[]).map(
          (section) => {
            const sortedItems = (section.boq_items ?? []).sort(
              (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
            )
            const total_budgeted = sortedItems.reduce(
              (sum, item) => sum + Number(item.budgeted_total),
              0
            )
            const total_used = sortedItems.reduce(
              (sum, item) => sum + Number(item.used_total),
              0
            )
            const usage_pct =
              total_budgeted > 0
                ? Math.round((total_used / total_budgeted) * 1000) / 10
                : 0

            const { boq_items, ...rest } = section
            return {
              ...rest,
              items: sortedItems,
              total_budgeted,
              total_used,
              usage_pct,
            }
          }
        )

        if (!cancelled) {
          setSections(sectionsWithItems)
        }
      } catch (err) {
        console.error('BOQ sections error: unexpected error:', err)
      } finally {
        if (!cancelled) {
          clearTimeout(timeout)
          setLoading(false)
        }
      }
    }

    fetchSections()

    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [projectId])

  return { sections, loading }
}
