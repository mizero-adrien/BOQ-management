'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface VarianceItem {
  id: string
  description: string
  unit: string
  estimated_unit_price: number
  actual_unit_price: number
  quantity_requested: number
  variance_per_unit: number
  variance_pct: number
  total_variance: number
  request_title: string
  project_name: string
}

export interface VarianceSummary {
  total_items: number
  total_estimated: number
  total_actual: number
  total_variance: number
  variance_pct: number
  over_budget_count: number
  under_budget_count: number
}

interface RawItem {
  id: string
  description: string
  unit: string
  estimated_unit_price: number
  actual_unit_price: number
  quantity_requested: number
  request_id: string
}

interface RequestRow {
  id: string
  title: string
  project_id: string
}

interface ProjectRow {
  id: string
  name: string
}

export function usePriceVariance(projectId?: string) {
  const [items, setItems] = useState<VarianceItem[]>([])
  const [summary, setSummary] = useState<VarianceSummary>({
    total_items: 0, total_estimated: 0, total_actual: 0,
    total_variance: 0, variance_pct: 0, over_budget_count: 0, under_budget_count: 0,
  })
  const [loading, setLoading] = useState(true)

  const fetchVariance = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: rawItems, error } = await supabase
      .from('purchase_request_items')
      .select('id, description, unit, estimated_unit_price, actual_unit_price, quantity_requested, request_id')
      .not('estimated_unit_price', 'is', null)
      .not('actual_unit_price', 'is', null)

    if (error) { console.error('usePriceVariance:', error.message); setLoading(false); return }

    const rows = (rawItems ?? []) as RawItem[]
    const requestIds = [...new Set(rows.map((r) => r.request_id))]

    if (requestIds.length === 0) { setItems([]); setLoading(false); return }

    const { data: requestRows } = await supabase
      .from('purchase_requests').select('id, title, project_id').in('id', requestIds)

    const requests = (requestRows ?? []) as RequestRow[]
    const projectIds = [...new Set(requests.map((r) => r.project_id))]

    const { data: projectRows } = projectIds.length > 0
      ? await supabase.from('projects').select('id, name').in('id', projectIds)
      : { data: [] }

    const reqMap = Object.fromEntries(requests.map((r) => [r.id, r]))
    const projMap = Object.fromEntries(((projectRows ?? []) as ProjectRow[]).map((p) => [p.id, p.name]))

    const filtered = projectId
      ? rows.filter((r) => reqMap[r.request_id]?.project_id === projectId)
      : rows

    const varianceItems: VarianceItem[] = filtered
      .filter((item) => item.estimated_unit_price > 0)
      .map((item) => {
        const variancePerUnit = item.actual_unit_price - item.estimated_unit_price
        const variancePct = (variancePerUnit / item.estimated_unit_price) * 100
        const totalVariance = variancePerUnit * item.quantity_requested
        const req = reqMap[item.request_id]
        return {
          id: item.id, description: item.description, unit: item.unit,
          estimated_unit_price: item.estimated_unit_price, actual_unit_price: item.actual_unit_price,
          quantity_requested: item.quantity_requested, variance_per_unit: variancePerUnit,
          variance_pct: variancePct, total_variance: totalVariance,
          request_title: req?.title ?? 'Unknown', project_name: projMap[req?.project_id ?? ''] ?? 'Unknown',
        }
      })

    setItems(varianceItems)

    const totalEstimated = varianceItems.reduce((s, i) => s + i.estimated_unit_price * i.quantity_requested, 0)
    const totalActual = varianceItems.reduce((s, i) => s + i.actual_unit_price * i.quantity_requested, 0)
    const totalVariance = totalActual - totalEstimated

    setSummary({
      total_items: varianceItems.length,
      total_estimated: totalEstimated, total_actual: totalActual, total_variance: totalVariance,
      variance_pct: totalEstimated > 0 ? (totalVariance / totalEstimated) * 100 : 0,
      over_budget_count: varianceItems.filter((i) => i.total_variance > 0).length,
      under_budget_count: varianceItems.filter((i) => i.total_variance < 0).length,
    })
    setLoading(false)
  }, [projectId])

  useEffect(() => { fetchVariance() }, [fetchVariance])

  return { items, summary, loading, refetch: fetchVariance }
}
