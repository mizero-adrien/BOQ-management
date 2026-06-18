'use client'

export const dynamic = 'force-dynamic'

import { usePriceVariance } from '@/hooks/usePriceVariance'
import VarianceSummaryCards from '@/components/procurement/VarianceSummaryCards'
import VarianceTable from '@/components/procurement/VarianceTable'

export default function VariancePage() {
  const { items, summary, loading } = usePriceVariance()

  function exportCSV() {
    const header = 'Description,Unit,Qty,Estimated,Actual,Variance,Variance %,Request'
    const lines = items.map((r) =>
      [r.description, r.unit, r.quantity_requested, r.estimated_unit_price,
        r.actual_unit_price, r.total_variance, r.variance_pct.toFixed(1) + '%', r.request_title].join(',')
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
    <div style={{ backgroundColor: '#F5F6FA', minHeight: '100vh', padding: '32px 20px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111111', marginBottom: '4px' }}>
              Price Variance
            </h1>
            <p style={{ fontSize: '14px', color: '#666666' }}>
              Compare budgeted vs actual purchase prices
            </p>
          </div>
          {items.length > 0 && (
            <button
              type="button"
              onClick={exportCSV}
              style={{ padding: '10px 20px', backgroundColor: '#FFFFFF', color: '#00236F',
                border: '1.5px solid #00236F', borderRadius: '10px', fontSize: '14px',
                fontWeight: '600', cursor: 'pointer' }}
            >
              Export CSV
            </button>
          )}
        </div>

        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl animate-pulse mb-3" style={{ height: '80px', backgroundColor: '#EEEEEE' }} />
          ))
        ) : (
          <>
            <VarianceSummaryCards summary={summary} />
            <VarianceTable items={items} />
          </>
        )}
      </div>
    </div>
  )
}
