import Link from 'next/link'
import BudgetProgressBar from './BudgetProgressBar'
import { formatCurrency } from '@/lib/utils'
import type { SectionWithItems } from '@/hooks/useBOQSections'

export default function SectionCard({ section }: { section: SectionWithItems }) {
  const itemsCount = section.items.length
  const totalQty = section.items.reduce((s, i) => s + i.quantity, 0)
  const usedQty = section.items.reduce((s, i) => s + i.used_quantity, 0)
  const qtyPct = totalQty > 0 ? Math.round((usedQty / totalQty) * 100) : 0

  let statusLabel: string
  let statusStyle: React.CSSProperties
  if (section.status === 'done') {
    statusLabel = 'Done'
    statusStyle = { backgroundColor: '#111111', color: '#FFFFFF' }
  } else if (section.status === 'in_progress') {
    statusLabel = 'In Progress'
    statusStyle = { border: '1px solid #111111', color: '#111111', backgroundColor: 'transparent' }
  } else {
    statusLabel = 'Not Started'
    statusStyle = { border: '1px solid #BBBBBB', color: '#BBBBBB', backgroundColor: 'transparent' }
  }

  return (
    <Link href={`/boq/${section.id}`} className="block bg-white rounded-xl border p-4" style={{ borderColor: '#EEEEEE' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 mr-3">
          <h3 className="text-sm font-semibold truncate" style={{ color: '#111111' }}>{section.title}</h3>
          <p className="text-xs mt-0.5" style={{ color: '#BBBBBB' }}>
            {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={statusStyle}>
            {statusLabel}
          </span>
          <ChevronRightIcon />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        {section.hasFinancials ? (
          <>
            <div>
              <p className="text-xs" style={{ color: '#666666' }}>Budget</p>
              <p className="text-sm font-semibold mt-0.5" style={{ color: '#111111' }}>{formatCurrency(section.total_budgeted)}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: '#666666' }}>Used</p>
              <p className="text-sm font-semibold mt-0.5" style={{ color: '#111111' }}>{formatCurrency(section.total_used)}</p>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="text-xs" style={{ color: '#666666' }}>Budgeted qty</p>
              <p className="text-sm font-semibold mt-0.5" style={{ color: '#111111' }}>{totalQty.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: '#666666' }}>Used qty</p>
              <p className="text-sm font-semibold mt-0.5" style={{ color: '#111111' }}>{usedQty.toFixed(1)}</p>
            </div>
          </>
        )}
      </div>

      {section.hasFinancials ? (
        <BudgetProgressBar used={section.total_used} total={section.total_budgeted} />
      ) : (
        <div className="rounded-full overflow-hidden" style={{ height: '6px', backgroundColor: '#EEEEEE' }}>
          <div className="h-full rounded-full" style={{ width: `${Math.min(100, qtyPct)}%`, backgroundColor: '#00236F' }} />
        </div>
      )}

      {section.hasFinancials && section.usage_pct >= 80 && (
        <p className="text-xs font-medium mt-1.5" style={{ color: '#E24B4A' }}>
          {section.usage_pct >= 100 ? 'Over budget' : `${section.usage_pct}% used — near limit`}
        </p>
      )}
    </Link>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#BBBBBB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}
