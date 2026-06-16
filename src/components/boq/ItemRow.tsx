import BudgetProgressBar from './BudgetProgressBar'
import { formatCurrency } from '@/lib/utils'
import type { BOQItemView } from '@/types/database'

export default function ItemRow({ item }: { item: BOQItemView }) {
  const hasFinancials = item.unit_rate !== null

  const progressPct = hasFinancials && (item.budgeted_total ?? 0) > 0
    ? ((item.used_total ?? 0) / item.budgeted_total!) * 100
    : item.quantity > 0
    ? (item.used_quantity / item.quantity) * 100
    : 0

  const isOverBudget = hasFinancials && progressPct >= 100
  const isNearLimit = hasFinancials && progressPct >= 80 && progressPct < 100

  const displayRate = hasFinancials ? formatCurrency(item.unit_rate!) : '—'
  const displayUsed = hasFinancials ? formatCurrency(item.used_total!) : '—'

  return (
    <div className="bg-white rounded-xl border p-4" style={{ borderColor: '#EEEEEE' }}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0 mr-3">
          <p className="text-sm font-medium" style={{ color: '#111111' }}>{item.description}</p>
          <p className="text-xs mt-0.5" style={{ color: '#666666' }}>Unit: {item.unit}</p>
        </div>
        {isOverBudget && (
          <span className="text-xs font-medium px-2 py-1 rounded-full flex-shrink-0"
            style={{ color: '#E24B4A', border: '1px solid #E24B4A', backgroundColor: '#FFF5F5' }}>
            Over budget
          </span>
        )}
        {isNearLimit && (
          <span className="text-xs font-medium px-2 py-1 rounded-full flex-shrink-0"
            style={{ color: '#E24B4A', backgroundColor: '#FFF5F5' }}>
            Near limit
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div>
          <p className="text-xs" style={{ color: '#666666' }}>Budget qty</p>
          <p className="text-xs font-semibold mt-0.5" style={{ color: '#111111' }}>
            {Number(item.quantity).toLocaleString(undefined, { maximumFractionDigits: 3 })}
          </p>
        </div>
        <div>
          <p className="text-xs" style={{ color: '#666666' }}>Rate</p>
          <p className="text-xs font-semibold mt-0.5" style={{ color: '#111111' }}>{displayRate}</p>
        </div>
        <div>
          <p className="text-xs" style={{ color: '#666666' }}>Used</p>
          <p className="text-xs font-semibold mt-0.5" style={{ color: '#111111' }}>{displayUsed}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          {hasFinancials ? (
            <BudgetProgressBar used={item.used_total ?? 0} total={item.budgeted_total ?? 0} />
          ) : (
            <div className="rounded-full overflow-hidden" style={{ height: '6px', backgroundColor: '#EEEEEE' }}>
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, progressPct)}%`, backgroundColor: '#00236F' }} />
            </div>
          )}
        </div>
        <span className="text-xs font-medium flex-shrink-0"
          style={{ color: progressPct >= 80 && hasFinancials ? '#E24B4A' : '#666666' }}>
          {hasFinancials
            ? `${progressPct.toFixed(1)}%`
            : `${item.used_quantity} / ${item.quantity} ${item.unit}`}
        </span>
      </div>
    </div>
  )
}
