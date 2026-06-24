'use client'

import { formatCurrency } from '@/lib/utils'

export type ProjectAnalytics = {
  project: { name: string; overall_progress: number; days_remaining: number }
  boq_summary: { usage_pct: number; total_used: number; total_budget: number; over_budget_items: number }
  reports_summary: { reports_this_week: number; avg_workers_this_week: number }
  schedule_health: { planned_progress_pct: number; schedule_variance: number }
  top_cost_items: CostItem[]
}

export type CostItem = {
  description: string
  unit: string
  used_total: number
  budgeted_total: number
  usage_pct: number
  section: string
}

const CARD: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  border: '0.5px solid #EEEEEE',
  padding: '20px',
}

const LABEL: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: '#BBBBBB',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  marginBottom: '8px',
}

export default function AnalyticsStatCards({ a }: { a: ProjectAnalytics }) {
  const budgetPct = Number(a.boq_summary.usage_pct)
  const budgetColor = budgetPct >= 90 ? '#E24B4A' : budgetPct >= 80 ? '#EF9F27' : '#00236F'
  const variance = Number(a.schedule_health.schedule_variance)
  const varianceColor = variance < -10 ? '#E24B4A' : variance > 5 ? '#5DCAA5' : '#666666'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
      <div style={CARD}>
        <p style={LABEL}>Budget usage</p>
        <p style={{ fontSize: '26px', fontWeight: 700, color: budgetColor, marginBottom: '4px' }}>
          {budgetPct}%
        </p>
        <p style={{ fontSize: '12px', color: '#666666' }}>
          {formatCurrency(Number(a.boq_summary.total_used))} of {formatCurrency(Number(a.boq_summary.total_budget))}
        </p>
      </div>

      <div style={CARD}>
        <p style={LABEL}>Schedule status</p>
        <p style={{ fontSize: '26px', fontWeight: 700, color: '#111111', marginBottom: '4px' }}>
          {Number(a.project.overall_progress)}%
        </p>
        <p style={{ fontSize: '12px', color: varianceColor }}>
          Planned {Number(a.schedule_health.planned_progress_pct)}% — Variance {variance > 0 ? '+' : ''}{variance}%
        </p>
      </div>

      <div style={CARD}>
        <p style={LABEL}>Reports this week</p>
        <p style={{ fontSize: '26px', fontWeight: 700, color: '#00236F', marginBottom: '4px' }}>
          {Number(a.reports_summary.reports_this_week)}
        </p>
        <p style={{ fontSize: '12px', color: '#666666' }}>
          Avg {Number(a.reports_summary.avg_workers_this_week)} workers per day
        </p>
      </div>
    </div>
  )
}
