'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { usePurchaseRequests } from '@/hooks/usePurchaseRequests'
import type { PurchaseRequest, PurchaseRequestItem } from '@/hooks/usePurchaseRequests'
import RequestStatusTimeline from '@/components/procurement/RequestStatusTimeline'
import RequestItemsTable from '@/components/procurement/RequestItemsTable'
import ApprovalPanel from '@/components/procurement/ApprovalPanel'

export default function RequestDetailPage() {
  const { requestId } = useParams() as { requestId: string }
  const router = useRouter()
  const { approveRequest, rejectRequest, submitForApproval } = usePurchaseRequests()
  const [request, setRequest] = useState<PurchaseRequest | null>(null)
  const [items, setItems] = useState<PurchaseRequestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserRole((user.user_metadata?.role as string) ?? '')
      const { data: req } = await supabase
        .from('purchase_requests').select('*').eq('id', requestId).single()
      const { data: ims } = await supabase
        .from('purchase_request_items').select('*').eq('request_id', requestId).order('created_at')
      if (req) {
        const row = req as Record<string, unknown>
        const { data: prof } = await supabase
          .from('profiles').select('full_name').eq('id', row.requested_by).single()
        const { data: proj } = await supabase
          .from('projects').select('name').eq('id', row.project_id).single()
        setRequest({
          ...(row as unknown as PurchaseRequest),
          requester_name: (prof as { full_name: string } | null)?.full_name ?? 'Unknown',
          project_name: (proj as { name: string } | null)?.name ?? 'Unknown',
        })
      }
      setItems((ims ?? []) as PurchaseRequestItem[])
      setLoading(false)
    }
    load()
  }, [requestId])

  async function handleApprove(id: string) {
    await approveRequest(id)
    router.push('/procurement/requests')
  }

  async function handleReject(id: string, reason: string) {
    await rejectRequest(id, reason)
    router.push('/procurement/requests')
  }

  if (loading) {
    return (
      <div style={{ backgroundColor: '#F5F6FA', minHeight: '100vh', padding: '32px 20px' }}>
        <div className="animate-pulse" style={{ height: '200px', backgroundColor: '#EEEEEE', borderRadius: '12px' }} />
      </div>
    )
  }

  if (!request) {
    return (
      <div style={{ backgroundColor: '#F5F6FA', minHeight: '100vh', padding: '32px', textAlign: 'center' }}>
        <p style={{ color: '#666666' }}>Request not found</p>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#F5F6FA', minHeight: '100vh', padding: '32px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <button type="button" onClick={() => router.back()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666666',
            marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to requests
        </button>

        <div className="bg-white rounded-xl p-5 mb-4" style={{ border: '1px solid #EEEEEE' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '600', color: '#111111', marginBottom: '6px' }}>
            {request.title}
          </h1>
          <p style={{ fontSize: '13px', color: '#666666' }}>
            {request.project_name} &middot; {request.requester_name}
            {request.required_by_date
              ? ` · Due ${new Date(request.required_by_date).toLocaleDateString()}`
              : ''}
          </p>
          {request.description && (
            <p style={{ marginTop: '10px', fontSize: '14px', color: '#111111' }}>{request.description}</p>
          )}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <RequestStatusTimeline status={request.status} rejectionReason={request.rejection_reason} />
        </div>

        {request.status === 'pending_approval' && userRole === 'pm' && (
          <div style={{ marginBottom: '16px' }}>
            <ApprovalPanel
              requestId={request.id}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          </div>
        )}

        {request.status === 'draft' && (
          <div style={{ marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => submitForApproval(request.id).then(() => router.push('/procurement/requests'))}
              style={{ width: '100%', padding: '14px', backgroundColor: '#00236F', color: '#FFFFFF',
                border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
            >
              Submit for approval
            </button>
          </div>
        )}

        {request.status === 'approved' && (
          <div style={{ marginBottom: '16px', textAlign: 'center' }}>
            <a
              href={`/procurement/orders/new?requestId=${request.id}`}
              style={{ display: 'inline-block', padding: '12px 24px', backgroundColor: '#00236F',
                color: '#FFFFFF', borderRadius: '10px', fontSize: '14px', fontWeight: '600',
                textDecoration: 'none' }}
            >
              Create purchase order
            </a>
          </div>
        )}

        <RequestItemsTable items={items} />
      </div>
    </div>
  )
}
