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

    createClient()
      .rpc('get_boq_summary_for_owner', { p_project_id: projectId })
      .then(({ data }) => {
        if (!cancelled) {
          setSections((data ?? []) as OwnerBOQSection[])
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [projectId])

  return { sections, loading }
}
