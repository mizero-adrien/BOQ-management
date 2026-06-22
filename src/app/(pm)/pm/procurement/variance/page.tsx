'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePMProjects } from '@/hooks/usePMProjects'
import VarianceSummaryCards from '@/components/procurement/VarianceSummaryCards'
import VarianceTable from '@/components/procurement/VarianceTable'
import ProcurementSubNav from '@/components/pm/procurement/ProcurementSubNav'
import type { VarianceItem, VarianceSummary } from '@/hooks/usePriceVariance'

const emptySummary: VarianceSummary = {
  total_items: 0,
  total_estimated: 0,
  total_actual: 0,
  total_variance: 0,
  variance_pct: 0,
  over_budget_count: 0,
  under_budget_count: 0,
}

export default function PMProcurementVariancePage() {
  const { projects, loading: projectsLoading } = usePMProjects()
  const [items, setItems] = useState<VarianceItem[]>([])
  const [summary, setSummary] = useState<VarianceSummary>(emptySummary)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (projectsLoading) return
    if (projects.length === 0) { setLoading(false); return }
    fetchVariance()
  }, [projects, projectsLoading])

  async function fetchVariance() {
    setLoading(true)
    const supabase = createClient()
    const projectIds = projects.map((p) => p.id)

    const { data: requestRows } = await supabase
      .from('purchase_requests')
      .select('id, title, project_id')
      .in('project_id', projectIds)

    const requests = (requestRows ?? []) as { id: string; title: string; project_id: string }[]
    if (requests.length === 0) { setItems([]); setSummary(emptySummary); setLoading(false); return }

    const requestIds = requests.map((r) => r.id)
    const reqMap = Object.fromEntries(requests.map((r) => [r.id, r]))

    const { data: rawItems } = await supabase
      .from('purchase_request_items')
      .select('id, description, unit, estimated_unit_price, actual_unit_price, quantity_requested, request_id')
      .in('request_id', requestIds)
      .not('estimated_unit_price', 'is', null)
      .not('actual_unit_price', 'is', null)

    const rows = (rawItems ?? []) as {
      id: string
      description: string
      unit: string
      estimated_unit_price: number
      actual_unit_price: number
      quantity_requested: number
      request_id: string
    }[]

    const projIds = [...new Set(requests.map((r) => r.project_id))]
    const { data: projectRows } = await supabase.from('projects').select('id, name').in('id', projIds)
    const projMap = Object.fromEntries(((projectRows ?? []) as { id: string; name: string }[]).map((p) => [p.id, p.name]))

    const varianceItems: VarianceItem[] = rows
      .filter((item) => item.estimated_unit_price > 0)
      .map((item) => {
        const variancePerUnit = item.actual_unit_price - item.estimated_unit_price
        const variancePct = (variancePerUnit / item.estimated_unit_price) * 100
        const totalVariance = variancePerUnit * item.quantity_requested
        const req = reqMap[item.request_id]
        return {
          id: item.id,
          description: item.description,
          unit: item.unit,
          estimated_unit_price: item.estimated_unit_price,
          actual_unit_price: item.actual_unit_price,
          quantity_requested: item.quantity_requested,
          variance_per_unit: variancePerUnit,
          variance_pct: variancePct,
          total_variance: totalVariance,
          request_title: req?.title ?? 'Unknown',
          project_name: projMap[req?.project_id ?? ''] ?? 'Unknown',
        }
      })

    setItems(varianceItems)

    const totalEstimated = varianceItems.reduce((s, i) => s + i.estimated_unit_price * i.quantity_requested, 0)
    const totalActual = varianceItems.reduce((s, i) => s + i.actual_unit_price * i.quantity_requested, 0)
    const totalVariance = totalActual - totalEstimated

    setSummary({
      total_items: varianceItems.length,
      total_estimated: totalEstimated,
      total_actual: totalActual,
      total_variance: totalVariance,
      variance_pct: totalEstimated > 0 ? (totalVariance / totalEstimated) * 100 : 0,
      over_budget_count: varianceItems.filter((i) => i.total_variance > 0).length,
      under_budget_count: varianceItems.filter((i) => i.total_variance < 0).length,
    })

    setLoading(false)
  }

  function exportCSV() {
    const header = 'Description,Unit,Qty,Estimated,Actual,Variance,Variance %,Request,Project'
    const lines = items.map((r) =>
      [
        r.description, r.unit, r.quantity_requested,
        r.estimated_unit_price, r.actual_unit_price,
        r.total_variance, r.variance_pct.toFixed(1) + '%',
        r.request_title, r.project_name,
      ].join(',')
    )
    const csv = [header, ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'price-variance.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <ProcurementSubNav />
      <div style={{ padding: '32px 24px', maxWidth: '1000px', margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111111', marginBottom: '4px' }}>Price Variance</h1>
            <p style={{ fontSize: '14px', color: '#666666' }}>Compare budgeted vs actual purchase prices across your projects</p>
          </div>
          {items.length > 0 && (
            <button
              type="button"
              onClick={exportCSV}
              style={{
                padding: '10px 20px',
                backgroundColor: '#FFFFFF',
                color: '#00236F',
                border: '1.5px solid #00236F',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Export CSV
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: '80px', backgroundColor: '#EEEEEE', borderRadius: '12px' }} className="animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <VarianceSummaryCards summary={summary} />
            <VarianceTable items={items} />
          </>
        )}
      </div>
    </>
  )
}
