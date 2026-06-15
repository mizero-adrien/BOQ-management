import type { BOQItem } from '@/types/database'

export default function LogItemInput({
  item,
  quantity,
  onChange,
}: {
  item: BOQItem
  quantity: number
  onChange: (value: number) => void
}) {
  const cost = quantity * Number(item.unit_rate)
  const wouldExceed = Number(item.used_total) + cost > Number(item.budgeted_total)

  function decrement() {
    if (quantity > 0) {
      onChange(quantity - 1)
    }
  }

  function increment() {
    onChange(quantity + 1)
  }

  return (
    <div
      className="bg-white rounded-xl border p-4"
      style={{ borderColor: '#EEEEEE' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 mr-3">
          <p className="text-sm font-medium" style={{ color: '#111111' }}>
            {item.description}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#666666' }}>
            Unit: {item.unit} &middot; Rate: {Number(item.unit_rate).toLocaleString()} RWF
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={decrement}
          disabled={quantity <= 0}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-semibold transition-colors disabled:opacity-30"
          style={{
            backgroundColor: '#F5F6FA',
            border: '1px solid #EEEEEE',
            color: '#111111',
          }}
          aria-label="Decrease quantity"
        >
          -
        </button>

        <span
          className="text-lg font-semibold w-12 text-center"
          style={{ color: '#111111' }}
        >
          {quantity}
        </span>

        <button
          type="button"
          onClick={increment}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-semibold transition-colors"
          style={{
            backgroundColor: '#00236F',
            color: '#FFFFFF',
          }}
          aria-label="Increase quantity"
        >
          +
        </button>

        <div className="ml-auto text-right">
          <p className="text-xs" style={{ color: '#666666' }}>
            Cost today
          </p>
          <p
            className="text-sm font-semibold"
            style={{ color: '#111111' }}
          >
            {cost.toLocaleString()} RWF
          </p>
        </div>
      </div>

      {wouldExceed && quantity > 0 && (
        <p
          className="text-xs font-medium mt-2"
          style={{ color: '#E24B4A' }}
        >
          This will exceed the budget for this item
        </p>
      )}
    </div>
  )
}
