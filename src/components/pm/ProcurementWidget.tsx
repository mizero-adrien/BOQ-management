'use client'

import Link from 'next/link'
import { usePurchaseRequests } from '@/hooks/usePurchaseRequests'

export default function ProcurementWidget() {
  const { requests, loading } = usePurchaseRequests()
  const pending = requests.filter((r) => r.status === 'pending_approval')

  if (loading) {
    return (
      <div className="rounded-xl animate-pulse" style={{ height: '72px', backgroundColor: '#EEEEEE' }} />
    )
  }

  if (pending.length === 0) return null

  return (
    <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: '#FFF9EC', border: '1px solid #EF9F27' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold" style={{ color: '#111111' }}>
          Purchase requests awaiting approval
        </p>
        <Link href="/procurement/requests" className="text-xs font-medium" style={{ color: '#EF9F27' }}>
          View all
        </Link>
      </div>
      <div className="space-y-2">
        {pending.slice(0, 3).map((req) => (
          <Link
            key={req.id}
            href={`/procurement/requests/${req.id}`}
            className="flex items-center justify-between rounded-lg px-3 py-2.5 bg-white"
            style={{ border: '1px solid #EEEEEE' }}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate" style={{ color: '#111111' }}>{req.title}</p>
              <p className="text-xs mt-0.5" style={{ color: '#666666' }}>
                {req.requester_name} &middot; {req.project_name}
              </p>
            </div>
            <span className="text-xs font-semibold ml-3 flex-shrink-0 px-2.5 py-1 rounded-full"
              style={{ backgroundColor: '#FEF9C3', color: '#854D0E' }}>
              Pending
            </span>
          </Link>
        ))}
        {pending.length > 3 && (
          <p className="text-xs text-center pt-1" style={{ color: '#EF9F27' }}>
            +{pending.length - 3} more
          </p>
        )}
      </div>
    </div>
  )
}
