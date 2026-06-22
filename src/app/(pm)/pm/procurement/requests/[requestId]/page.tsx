'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import ProcurementSubNav from '@/components/pm/procurement/ProcurementSubNav'
import RequestStatusTimeline from '@/components/procurement/RequestStatusTimeline'
import RequestItemsTable from '@/components/procurement/RequestItemsTable'
import ApprovalPanel from '@/components/procurement/ApprovalPanel'
import type { PurchaseRequest, PurchaseRequestItem, PurchaseRequestStatus } from '@/hooks/usePurchaseRequests'

export default function PMRequestDetailPage() {
  const { requestId } = useParams() as { requestId: string }
  const router = useRouter()
  const [request, setRequest] = useState<PurchaseRequest | null>(null)
  const [items, setItems] = useState<PurchaseRequestItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const [reqRes, itemsRes] = await Promise.all([
        supabase.from('purchase_requests').select('*').eq('id', requestId).single(),
        supabase.from('purchase_request_items').select('*').eq('request_id', requestId).order('created_at'),
      ])

      if (reqRes.data) {
        const row = reqRes.data as Record<string, unknown>

        const [profRes, projRes] = await Promise.all([
          supabase.from('profiles').select('full_name').eq('id', row.requested_by as string).single(),
          supabase.from('projects').select('name').eq('id', row.project_id as string).single(),
        ])

        setRequest({
          ...(row as unknown as PurchaseRequest),
          requester_name: (profRes.data as { full_name: string } | null)?.full_name ?? 'Unknown',
          project_name: (projRes.data as { name: string } | null)?.name ?? 'Unknown',
        })
      }

      setItems((itemsRes.data ?? []) as PurchaseRequestItem[])
      setLoading(false)
    }
    load()
  }, [requestId])

  async function handleApprove(id: string): Promise<void> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('purchase_requests')
      .update({
        status: 'approved' as PurchaseRequestStatus,
        approved_by: user?.id ?? null,
        approved_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      toast.error('Could not approve request', error.message)
      return
    }

    toast.success('Request approved', 'Procurement has been notified')
    router.push('/pm/procurement')
  }

  async function handleReject(id: string, reason: string): Promise<void> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('purchase_requests')
      .update({
        status: 'rejected' as PurchaseRequestStatus,
        approved_by: user?.id ?? null,
        approved_at: new Date().toISOString(),
        rejection_reason: reason,
      })
      .eq('id', id)

    if (error) {
      toast.error('Could not reject request', error.message)
      return
    }

    toast.info('Request rejected', 'Procurement has been notified')
    router.push('/pm/procurement')
  }

  if (loading) {
    return (
      <>
        <ProcurementSubNav />
        <div style={{ padding: '32px 24px', maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ height: '200px', backgroundColor: '#EEEEEE', borderRadius: '12px' }} className="animate-pulse" />
        </div>
      </>
    )
  }

  if (!request) {
    return (
      <>
        <ProcurementSubNav />
        <div style={{ padding: '32px 24px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: '#666666', fontSize: '14px' }}>Request not found.</p>
          <Link href="/pm/procurement/requests" style={{ fontSize: '14px', color: '#00236F', textDecoration: 'none' }}>
            Back to requests
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <ProcurementSubNav />
      <div style={{ padding: '32px 24px', maxWidth: '800px', margin: '0 auto' }}>

        <Link
          href="/pm/procurement/requests"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '14px',
            color: '#666666',
            textDecoration: 'none',
            marginBottom: '20px',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to requests
        </Link>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '0.5px solid #EEEEEE', padding: '24px', marginBottom: '16px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '600', color: '#111111', marginBottom: '6px' }}>
            {request.title}
          </h1>
          <p style={{ fontSize: '13px', color: '#666666', marginBottom: request.description ? '12px' : '0' }}>
            {request.project_name}
            {request.requester_name ? ` — ${request.requester_name}` : ''}
            {request.required_by_date ? ` — Required by ${new Date(request.required_by_date).toLocaleDateString('en-RW', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
          </p>
          {request.description && (
            <p style={{ fontSize: '14px', color: '#111111', marginTop: '10px' }}>{request.description}</p>
          )}
          {request.total_estimated_cost != null && (
            <div style={{ marginTop: '12px', padding: '10px 14px', backgroundColor: '#E4E9FA', borderRadius: '8px', display: 'inline-block' }}>
              <span style={{ fontSize: '13px', color: '#666666' }}>Estimated total: </span>
              <span style={{ fontSize: '15px', fontWeight: '600', color: '#00236F' }}>{formatCurrency(request.total_estimated_cost)}</span>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <RequestStatusTimeline status={request.status} rejectionReason={request.rejection_reason} />
        </div>

        {request.status === 'pending_approval' && (
          <div style={{ marginBottom: '16px' }}>
            <ApprovalPanel
              requestId={request.id}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          </div>
        )}

        <RequestItemsTable items={items} />
      </div>
    </>
  )
}
