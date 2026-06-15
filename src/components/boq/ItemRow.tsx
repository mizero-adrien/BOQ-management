import BudgetProgressBar from './BudgetProgressBar'
import { formatCurrency } from '@/lib/utils'
import type { BOQItem } from '@/types/database'

export default function ItemRow({ item }: { item: BOQItem }) {
  const usedPct =
    Number(item.budgeted_total) > 0
      ? (Number(item.used_total) / Number(item.budgeted_total)) * 100
      : 0
  const isOverBudget = usedPct >= 100
  const isNearLimit = usedPct >= 80 && usedPct < 100

  return (
    <div
      className="bg-white rounded-xl border p-4"
      style={{ borderColor: '#EEEEEE' }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0 mr-3">
          <p className="text-sm font-medium" style={{ color: '#111111' }}>
            {item.description}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#666666' }}>
            Unit: {item.unit}
          </p>
        </div>
        {isOverBudget && (
          <span
            className="text-xs font-medium px-2 py-1 rounded-full flex-shrink-0"
            style={{
              color: '#E24B4A',
              border: '1px solid #E24B4A',
              backgroundColor: '#FFF5F5',
            }}
          >
            Over budget
          </span>
        )}
        {isNearLimit && !isOverBudget && (
          <span
            className="text-xs font-medium px-2 py-1 rounded-full flex-shrink-0"
            style={{
              color: '#E24B4A',
              backgroundColor: '#FFF5F5',
            }}
          >
            Near limit
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div>
          <p className="text-xs" style={{ color: '#666666' }}>
            Budget qty
          </p>
          <p className="text-xs font-semibold mt-0.5" style={{ color: '#111111' }}>
            {Number(item.quantity).toLocaleString(undefined, {
              maximumFractionDigits: 3,
            })}
          </p>
        </div>
        <div>
          <p className="text-xs" style={{ color: '#666666' }}>
            Rate
          </p>
          <p className="text-xs font-semibold mt-0.5" style={{ color: '#111111' }}>
            {formatCurrency(Number(item.unit_rate))}
          </p>
        </div>
        <div>
          <p className="text-xs" style={{ color: '#666666' }}>
            Used
          </p>
          <p className="text-xs font-semibold mt-0.5" style={{ color: '#111111' }}>
            {formatCurrency(Number(item.used_total))}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <BudgetProgressBar
            used={Number(item.used_total)}
            total={Number(item.budgeted_total)}
          />
        </div>
        <span
          className="text-xs font-medium flex-shrink-0"
          style={{ color: usedPct >= 80 ? '#E24B4A' : '#666666' }}
        >
          {usedPct.toFixed(1)}%
        </span>
      </div>
    </div>
  )
}
