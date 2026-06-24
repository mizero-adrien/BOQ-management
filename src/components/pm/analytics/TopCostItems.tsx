'use client'

import { formatCurrency } from '@/lib/utils'
import type { CostItem } from './AnalyticsStatCards'

function barColor(pct: number) {
  if (pct >= 90) return '#E24B4A'
  if (pct >= 80) return '#EF9F27'
  return '#00236F'
}

export default function TopCostItems({ items }: { items: CostItem[] }) {
  if (items.length === 0) return null

  return (
    <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '0.5px solid #EEEEEE', padding: '24px' }}>
      <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#111111', marginBottom: '16px' }}>
        Top cost items
      </h2>
      {items.slice(0, 5).map((item, i) => {
        const pct = Number(item.usage_pct)
        const color = barColor(pct)
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: i < 4 ? '14px' : '0' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 500, color: '#111111', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.description}
              </p>
              <p style={{ fontSize: '11px', color: '#BBBBBB' }}>{item.section} — {item.unit}</p>
            </div>
            <div style={{ width: '120px', flexShrink: 0 }}>
              <div style={{ backgroundColor: '#EEEEEE', borderRadius: '4px', height: '5px', overflow: 'hidden', marginBottom: '3px' }}>
                <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', backgroundColor: color, borderRadius: '4px' }} />
              </div>
              <p style={{ fontSize: '11px', color, textAlign: 'right' }}>{pct}%</p>
            </div>
            <p style={{ fontSize: '13px', fontWeight: 500, color: '#111111', width: '110px', textAlign: 'right', flexShrink: 0 }}>
              {formatCurrency(Number(item.used_total))}
            </p>
          </div>
        )
      })}
    </div>
  )
}
