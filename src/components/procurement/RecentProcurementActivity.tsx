'use client'

import type { PurchaseRequest } from '@/hooks/usePurchaseRequests'

const STATUS_COLOR: Record<string, string> = {
  draft: '#BBBBBB',
  pending_approval: '#EF9F27',
  approved: '#5DCAA5',
  rejected: '#E24B4A',
  ordered: '#00236F',
  partially_delivered: '#EF9F27',
  delivered: '#5DCAA5',
  cancelled: '#BBBBBB',
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft created',
  pending_approval: 'Submitted for approval',
  approved: 'Approved',
  rejected: 'Rejected',
  ordered: 'Order placed',
  partially_delivered: 'Partially delivered',
  delivered: 'Fully delivered',
  cancelled: 'Cancelled',
}

interface Props {
  requests: PurchaseRequest[]
}

export default function RecentProcurementActivity({ requests }: Props) {
  const recent = [...requests]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 8)

  if (recent.length === 0) {
    return (
      <div className="bg-white rounded-xl px-4 py-8 text-center" style={{ border: '1px solid #EEEEEE' }}>
        <p className="text-sm" style={{ color: '#BBBBBB' }}>No recent activity</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #EEEEEE' }}>
      {recent.map((req, idx) => (
        <div
          key={req.id}
          className="flex items-start gap-3 px-4 py-3"
          style={{ borderBottom: idx < recent.length - 1 ? '1px solid #EEEEEE' : undefined }}
        >
          <div
            className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
            style={{ backgroundColor: STATUS_COLOR[req.status] ?? '#BBBBBB' }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate" style={{ color: '#111111' }}>{req.title}</p>
            <p className="text-xs mt-0.5" style={{ color: '#666666' }}>
              {STATUS_LABEL[req.status] ?? req.status}
            </p>
          </div>
          <span className="text-xs flex-shrink-0" style={{ color: '#BBBBBB' }}>
            {new Date(req.updated_at).toLocaleDateString()}
          </span>
        </div>
      ))}
    </div>
  )
}
