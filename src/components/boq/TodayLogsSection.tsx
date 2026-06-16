'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'

interface LogEntry {
  id: string
  quantity_used: number
  cost_rwf: number
  item_description: string
}

type RawLog = {
  id: string
  quantity_used: number
  cost_rwf: number
  item: { description: string } | null
}

export default function TodayLogsSection({ sectionId }: { sectionId: string }) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { if (!cancelled) setLoading(false); return }

      const today = new Date().toISOString().split('T')[0]

      const { data: reportData } = await supabase
        .from('daily_reports')
        .select('id')
        .eq('engineer_id', user.id)
        .eq('report_date', today)
        .limit(1)
        .maybeSingle()

      if (!reportData) { if (!cancelled) setLoading(false); return }

      const { data: itemIds } = await supabase
        .from('boq_items')
        .select('id')
        .eq('section_id', sectionId)

      const ids = (itemIds ?? []).map((i) => i.id)
      if (ids.length === 0) { if (!cancelled) setLoading(false); return }

      const { data: logData } = await supabase
        .from('material_logs')
        .select('id, quantity_used, cost_rwf, item:boq_items(description)')
        .eq('report_id', reportData.id)
        .in('boq_item_id', ids)
        .order('logged_at', { ascending: false })

      if (cancelled) return
      setLogs(
        ((logData ?? []) as unknown as RawLog[]).map((l) => ({
          id: l.id,
          quantity_used: l.quantity_used,
          cost_rwf: l.cost_rwf,
          item_description: l.item?.description ?? 'Unknown item',
        }))
      )
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [sectionId])

  if (loading || logs.length === 0) return null

  return (
    <div className="mt-6">
      <p className="text-sm font-semibold mb-3" style={{ color: '#111111' }}>Today's material logs</p>
      <div className="space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="bg-white rounded-xl px-4 py-3 border" style={{ borderColor: '#EEEEEE' }}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium" style={{ color: '#111111' }}>{log.item_description}</p>
              <p className="text-sm font-semibold" style={{ color: '#00236F' }}>{formatCurrency(log.cost_rwf)}</p>
            </div>
            <p className="text-xs mt-0.5" style={{ color: '#666666' }}>Quantity: {log.quantity_used}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
