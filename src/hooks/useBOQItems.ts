'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { BOQItemView } from '@/types/database'

export function useBOQItems(sectionId: string | undefined) {
  const [items, setItems] = useState<BOQItemView[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sectionId) {
      setLoading(false)
      return
    }

    let cancelled = false

    const timeout = setTimeout(() => {
      if (!cancelled) {
        console.error('BOQ items error: timed out after 8 seconds')
        setLoading(false)
      }
    }, 8000)

    async function fetchItems() {
      const supabase = createClient()
      try {
        const { data, error } = await supabase
          .rpc('get_boq_items_for_role', { p_section_id: sectionId })

        if (error) {
          console.error('BOQ items error:', error.message)
          return
        }
        if (!cancelled) {
          setItems((data ?? []) as BOQItemView[])
        }
      } catch (err) {
        console.error('BOQ items error: unexpected error:', err)
      } finally {
        if (!cancelled) {
          clearTimeout(timeout)
          setLoading(false)
        }
      }
    }

    fetchItems()
    return () => { cancelled = true; clearTimeout(timeout) }
  }, [sectionId])

  return { items, loading }
}
