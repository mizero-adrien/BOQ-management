'use client'

import type { VarianceItem } from '@/hooks/usePriceVariance'

interface Props {
  items: VarianceItem[]
}

function fmt(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

export default function VarianceTable({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl px-4 py-12 text-center" style={{ border: '1px solid #EEEEEE' }}>
        <p className="text-sm" style={{ color: '#BBBBBB' }}>No price variance data yet</p>
        <p className="text-xs mt-1" style={{ color: '#BBBBBB' }}>
          Variance appears when actual prices are recorded on delivered items
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #EEEEEE' }}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid #EEEEEE', backgroundColor: '#F5F6FA' }}>
              <th className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color: '#666666' }}>Item</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold" style={{ color: '#666666' }}>Estimated</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold" style={{ color: '#666666' }}>Actual</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold" style={{ color: '#666666' }}>Variance</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold" style={{ color: '#666666' }}>%</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const isOver = item.total_variance > 0
              return (
                <tr key={item.id} style={{ borderBottom: idx < items.length - 1 ? '1px solid #EEEEEE' : undefined }}>
                  <td className="px-4 py-3">
                    <p className="text-sm" style={{ color: '#111111' }}>{item.description}</p>
                    <p className="text-xs" style={{ color: '#BBBBBB' }}>{item.request_title}</p>
                  </td>
                  <td className="px-4 py-3 text-right text-sm" style={{ color: '#666666' }}>
                    {fmt(item.estimated_unit_price)} /{item.unit}
                  </td>
                  <td className="px-4 py-3 text-right text-sm" style={{ color: '#666666' }}>
                    {fmt(item.actual_unit_price)} /{item.unit}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium" style={{ color: isOver ? '#E24B4A' : '#5DCAA5' }}>
                    {isOver ? '+' : ''}{fmt(item.total_variance)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium" style={{ color: isOver ? '#E24B4A' : '#5DCAA5' }}>
                    {isOver ? '+' : ''}{item.variance_pct.toFixed(1)}%
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
