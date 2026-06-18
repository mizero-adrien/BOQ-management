'use client'

import type { PurchaseRequestStatus } from '@/hooks/usePurchaseRequests'

const STEPS: { status: PurchaseRequestStatus; label: string }[] = [
  { status: 'draft', label: 'Draft' },
  { status: 'pending_approval', label: 'Submitted' },
  { status: 'approved', label: 'Approved' },
  { status: 'ordered', label: 'Ordered' },
  { status: 'delivered', label: 'Delivered' },
]

const STATUS_ORDER: Record<PurchaseRequestStatus, number> = {
  draft: 0, pending_approval: 1, approved: 2, rejected: 2,
  ordered: 3, partially_delivered: 3, delivered: 4, cancelled: -1,
}

interface Props {
  status: PurchaseRequestStatus
  rejectionReason?: string | null
}

export default function RequestStatusTimeline({ status, rejectionReason }: Props) {
  const currentOrder = STATUS_ORDER[status] ?? 0
  const isRejected = status === 'rejected'
  const isCancelled = status === 'cancelled'

  if (isCancelled) {
    return (
      <div className="rounded-xl px-4 py-3" style={{ backgroundColor: '#F3F4F6', border: '1px solid #EEEEEE' }}>
        <p className="text-sm font-medium" style={{ color: '#6B7280' }}>Request cancelled</p>
      </div>
    )
  }

  return (
    <div>
      {isRejected && rejectionReason && (
        <div className="rounded-xl px-4 py-3 mb-3" style={{ backgroundColor: '#FEF2F2', border: '1px solid #E24B4A' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: '#E24B4A' }}>Rejection reason</p>
          <p className="text-sm" style={{ color: '#111111' }}>{rejectionReason}</p>
        </div>
      )}
      <div className="flex items-center gap-0">
        {STEPS.map((step, idx) => {
          const stepOrder = STATUS_ORDER[step.status]
          const isDone = currentOrder > stepOrder
          const isCurrent = currentOrder === stepOrder && !isRejected
          const isRejectedStep = isRejected && stepOrder === STATUS_ORDER['pending_approval']
          const color = isRejectedStep ? '#E24B4A' : isDone || isCurrent ? '#00236F' : '#EEEEEE'
          const textColor = isDone || isCurrent ? '#00236F' : isRejectedStep ? '#E24B4A' : '#BBBBBB'
          return (
            <div key={step.status} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: isDone || isCurrent ? color : '#F5F6FA', border: `2px solid ${color}` }}>
                  {isDone && <svg width="10" height="10" viewBox="0 0 12 12" fill="white"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>}
                </div>
                <p className="text-xs mt-1 text-center" style={{ color: textColor, fontSize: '10px' }}>
                  {isRejectedStep ? 'Rejected' : step.label}
                </p>
              </div>
              {idx < STEPS.length - 1 && (
                <div className="h-px flex-1 -mt-4" style={{ backgroundColor: currentOrder > stepOrder ? '#00236F' : '#EEEEEE' }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
