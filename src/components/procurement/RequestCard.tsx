'use client'

import Link from 'next/link'
import type { PurchaseRequest, PurchaseRequestStatus } from '@/hooks/usePurchaseRequests'

const STATUS_STYLE: Record<PurchaseRequestStatus, { bg: string; text: string; label: string }> = {
  draft:               { bg: '#F3F4F6', text: '#374151', label: 'Draft' },
  pending_approval:    { bg: '#FEF9C3', text: '#854D0E', label: 'Pending approval' },
  approved:            { bg: '#D1FAE5', text: '#065F46', label: 'Approved' },
  rejected:            { bg: '#FEE2E2', text: '#991B1B', label: 'Rejected' },
  ordered:             { bg: '#E4E9FA', text: '#00236F', label: 'Ordered' },
  partially_delivered: { bg: '#FEF3C7', text: '#92400E', label: 'Partial delivery' },
  delivered:           { bg: '#D1FAE5', text: '#065F46', label: 'Delivered' },
  cancelled:           { bg: '#F3F4F6', text: '#6B7280', label: 'Cancelled' },
}

interface Props {
  request: PurchaseRequest
  href: string
}

export default function RequestCard({ request, href }: Props) {
  const style = STATUS_STYLE[request.status] ?? STATUS_STYLE.draft

  return (
    <Link href={href} className="block bg-white rounded-xl px-4 py-4 mb-2" style={{ border: '1px solid #EEEEEE' }}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-sm font-semibold flex-1 min-w-0 truncate" style={{ color: '#111111' }}>
          {request.title}
        </p>
        <span className="flex-shrink-0 text-xs font-semibold rounded-full px-2.5 py-1"
          style={{ backgroundColor: style.bg, color: style.text }}>
          {style.label}
        </span>
      </div>
      <p className="text-xs mb-1" style={{ color: '#666666' }}>{request.project_name}</p>
      <div className="flex items-center gap-3 mt-2">
        <span className="text-xs" style={{ color: '#BBBBBB' }}>
          {new Date(request.created_at).toLocaleDateString()}
        </span>
        {request.total_estimated_cost != null && (
          <span className="text-xs font-medium" style={{ color: '#666666' }}>
            Est. {request.total_estimated_cost.toLocaleString()} RWF
          </span>
        )}
        {request.required_by_date && (
          <span className="text-xs" style={{ color: '#666666' }}>
            Need by {new Date(request.required_by_date).toLocaleDateString()}
          </span>
        )}
      </div>
    </Link>
  )
}
