'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useTodayReport(
  projectId: string | undefined,
  engineerId: string | undefined
) {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId || !engineerId) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function checkReport() {
      const supabase = createClient()
      const today = new Date().toISOString().split('T')[0]

      try {
        const { data, error } = await supabase
          .from('daily_reports')
          .select('id, status')
          .eq('project_id', projectId)
          .eq('engineer_id', engineerId)
          .eq('report_date', today)
          .eq('status', 'submitted')
          .maybeSingle()

        if (error) {
          console.error('Today report error:', error.message)
        }

        if (!cancelled) {
          setSubmitted(!!data)
          setLoading(false)
        }
      } catch (err) {
        console.error('Today report error: unexpected error:', err)
        if (!cancelled) setLoading(false)
      }
    }

    checkReport()

    return () => {
      cancelled = true
    }
  }, [projectId, engineerId])

  return { submitted, loading }
}
