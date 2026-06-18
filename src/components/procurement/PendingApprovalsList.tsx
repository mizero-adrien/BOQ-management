'use client'

import Link from 'next/link'
import type { PurchaseRequest } from '@/hooks/usePurchaseRequests'

interface Props {
  requests: PurchaseRequest[]
  approveHref?: (id: string) => string
}

export default function PendingApprovalsList({ requests, approveHref }: Props) {
  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-xl px-4 py-8 text-center" style={{ border: '1px solid #EEEEEE' }}>
        <p className="text-sm" style={{ color: '#BBBBBB' }}>No requests pending approval</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {requests.map((req) => (
        <Link
          key={req.id}
          href={approveHref ? approveHref(req.id) : `/procurement/requests/${req.id}`}
          className="flex items-start gap-3 bg-white rounded-xl px-4 py-3"
          style={{ border: '1px solid #EF9F27', borderLeft: '4px solid #EF9F27' }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: '#111111' }}>{req.title}</p>
            <p className="text-xs mt-0.5" style={{ color: '#666666' }}>
              {req.requester_name} &middot; {req.project_name}
            </p>
            {req.total_estimated_cost != null && (
              <p className="text-xs mt-0.5 font-medium" style={{ color: '#EF9F27' }}>
                Est. {req.total_estimated_cost.toLocaleString()} RWF
              </p>
            )}
          </div>
          <span className="text-xs flex-shrink-0 mt-0.5" style={{ color: '#BBBBBB' }}>
            {req.submitted_at ? new Date(req.submitted_at).toLocaleDateString() : ''}
          </span>
        </Link>
      ))}
    </div>
  )
}
