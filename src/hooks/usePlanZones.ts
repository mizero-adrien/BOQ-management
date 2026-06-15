'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PlanZone } from '@/types/database'

export function usePlanZones(projectId: string | undefined) {
  const [zones, setZones] = useState<PlanZone[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) return

    async function fetchZones() {
      const supabase = createClient()

      const { data } = await supabase
        .from('plan_zones')
        .select('*')
        .eq('project_id', projectId)
        .order('name', { ascending: true })

      setZones(data ?? [])
      setLoading(false)
    }

    fetchZones()
  }, [projectId])

  return { zones, loading }
}
