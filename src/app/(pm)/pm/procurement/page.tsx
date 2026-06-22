'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePMProjects } from '@/hooks/usePMProjects'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { toast } from '@/lib/toast'
import ProcurementSubNav from '@/components/pm/procurement/ProcurementSubNav'
import type { PurchaseRequestStatus } from '@/hooks/usePurchaseRequests'

interface PendingRequest {
  id: string
  title: string
  priority: string
  required_by_date: string | null
  total_estimated_cost: number | null
  requester_name: string
  project_name: string
  created_at: string
}

interface Stats {
  pendingApprovals: number
  activeOrders: number
  overdueOrders: number
  thisMonthSpend: number
}

const priorityColour: Record<string, string> = {
  urgent: '#E24B4A',
  high: '#EF9F27',
  normal: '#778EDE',
  low: '#BBBBBB',
}

export default function PMProcurementPage() {
  const { projects, loading: projectsLoading } = usePMProjects()
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
  const [stats, setStats] = useState<Stats>({ pendingApprovals: 0, activeOrders: 0, overdueOrders: 0, thisMonthSpend: 0 })
  const [loading, setLoading] = useState(true)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({})

  useEffect(() => {
    if (projectsLoading) return
    if (projects.length === 0) { setLoading(false); return }
    fetchData()
  }, [projects, projectsLoading])

  async function fetchData() {
    setLoading(true)
    const supabase = createClient()
    const projectIds = projects.map((p) => p.id)
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const today = now.toISOString().split('T')[0]

    const { data: pending } = await supabase
      .from('purchase_requests')
      .select('id, title, priority, required_by_date, total_estimated_cost, created_at, requested_by, project_id')
      .in('project_id', projectIds)
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: true })

    const rows = pending ?? []
    const userIds = [...new Set(rows.map((r: { requested_by: string }) => r.requested_by))]
    const reqProjectIds = [...new Set(rows.map((r: { project_id: string }) => r.project_id))]

    const [profilesRes, projectsRes] = await Promise.all([
      userIds.length > 0
        ? supabase.from('profiles').select('id, full_name').in('id', userIds)
        : Promise.resolve({ data: [] }),
      reqProjectIds.length > 0
        ? supabase.from('projects').select('id, name').in('id', reqProjectIds)
        : Promise.resolve({ data: [] }),
    ])

    type NameRow = { id: string; full_name?: string; name?: string }
    const nameMap = Object.fromEntries(((profilesRes.data ?? []) as NameRow[]).map((p) => [p.id, p.full_name ?? '']))
    const projMap = Object.fromEntries(((projectsRes.data ?? []) as NameRow[]).map((p) => [p.id, p.name ?? '']))

    const mapped: PendingRequest[] = rows.map((r: {
      id: string
      title: string
      priority: string
      required_by_date: string | null
      total_estimated_cost: number | null
      created_at: string
      requested_by: string
      project_id: string
    }) => ({
      id: r.id,
      title: r.title,
      priority: r.priority ?? 'normal',
      required_by_date: r.required_by_date,
      total_estimated_cost: r.total_estimated_cost,
      requester_name: nameMap[r.requested_by] ?? 'Unknown',
      project_name: projMap[r.project_id] ?? '',
      created_at: r.created_at,
    }))

    setPendingRequests(mapped)

    const { data: requestRows } = await supabase
      .from('purchase_requests')
      .select('id')
      .in('project_id', projectIds)

    const allRequestIds = (requestRows ?? []).map((r: { id: string }) => r.id)

    const [ordersActiveRes, ordersOverdueRes, ordersSpendRes] = await Promise.all([
      allRequestIds.length > 0
        ? supabase.from('purchase_orders').select('id', { count: 'exact', head: true }).in('request_id', allRequestIds).eq('status', 'pending')
        : Promise.resolve({ count: 0 }),
      allRequestIds.length > 0
        ? supabase.from('purchase_orders').select('id', { count: 'exact', head: true }).in('request_id', allRequestIds).eq('status', 'pending').lt('expected_delivery_date', today)
        : Promise.resolve({ count: 0 }),
      allRequestIds.length > 0
        ? supabase.from('purchase_orders').select('total_amount').in('request_id', allRequestIds).gte('created_at', monthStart)
        : Promise.resolve({ data: [] }),
    ])

    const monthSpend = ((ordersSpendRes as { data?: { total_amount: number }[] }).data ?? [])
      .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)

    setStats({
      pendingApprovals: mapped.length,
      activeOrders: (ordersActiveRes as { count: number | null }).count ?? 0,
      overdueOrders: (ordersOverdueRes as { count: number | null }).count ?? 0,
      thisMonthSpend: monthSpend,
    })

    setLoading(false)
  }

  async function handleApprove(requestId: string) {
    setApprovingId(requestId)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('purchase_requests')
      .update({
        status: 'approved' as PurchaseRequestStatus,
        approved_by: user?.id ?? null,
        approved_at: new Date().toISOString(),
      })
      .eq('id', requestId)

    if (error) {
      toast.error('Could not approve request', error.message)
    } else {
      toast.success('Request approved', 'Procurement has been notified')
      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId))
      setStats((prev) => ({ ...prev, pendingApprovals: Math.max(0, prev.pendingApprovals - 1) }))
    }
    setApprovingId(null)
  }

  async function handleReject(requestId: string) {
    const reason = rejectionReasons[requestId] ?? ''
    if (!reason.trim()) {
      toast.warning('Rejection reason required', 'Enter a reason before rejecting')
      return
    }
    setRejectingId(requestId)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('purchase_requests')
      .update({
        status: 'rejected' as PurchaseRequestStatus,
        approved_by: user?.id ?? null,
        approved_at: new Date().toISOString(),
        rejection_reason: reason.trim(),
      })
      .eq('id', requestId)

    if (error) {
      toast.error('Could not reject request', error.message)
    } else {
      toast.info('Request rejected', 'Procurement has been notified')
      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId))
      setStats((prev) => ({ ...prev, pendingApprovals: Math.max(0, prev.pendingApprovals - 1) }))
      setRejectionReasons((prev) => { const next = { ...prev }; delete next[requestId]; return next })
    }
    setRejectingId(null)
  }

  if (projectsLoading) {
    return (
      <>
        <ProcurementSubNav />
        <div style={{ padding: '32px 24px', maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ height: '120px', backgroundColor: '#EEEEEE', borderRadius: '12px' }} className="animate-pulse" />
        </div>
      </>
    )
  }

  if (projects.length === 0) {
    return (
      <>
        <ProcurementSubNav />
        <div style={{ padding: '32px 24px', maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111111', marginBottom: '4px' }}>Procurement</h1>
            <p style={{ fontSize: '14px', color: '#666666' }}>Review and approve purchase requests</p>
          </div>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '0.5px solid #EEEEEE', padding: '48px', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', fontWeight: '600', color: '#111111', marginBottom: '8px' }}>No projects yet</p>
            <p style={{ fontSize: '14px', color: '#BBBBBB' }}>Create a project first to manage procurement.</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <ProcurementSubNav />
      <div style={{ padding: '32px 24px', maxWidth: '960px', margin: '0 auto' }}>

        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111111', marginBottom: '4px' }}>Procurement</h1>
          <p style={{ fontSize: '14px', color: '#666666' }}>Review and approve purchase requests from your procurement team</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Pending approvals', value: stats.pendingApprovals, colour: stats.pendingApprovals > 0 ? '#E24B4A' : '#111111' },
            { label: 'Active orders', value: stats.activeOrders, colour: '#00236F' },
            { label: 'Overdue orders', value: stats.overdueOrders, colour: stats.overdueOrders > 0 ? '#E24B4A' : '#111111' },
            { label: 'This month spend', value: formatCurrency(stats.thisMonthSpend), colour: '#00236F' },
          ].map((stat) => (
            <div key={stat.label} style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '0.5px solid #EEEEEE', padding: '20px' }}>
              <p style={{ fontSize: '22px', fontWeight: '600', color: stat.colour, marginBottom: '4px' }}>{stat.value}</p>
              <p style={{ fontSize: '12px', color: '#666666' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111111' }}>
            Pending approvals
            {stats.pendingApprovals > 0 && (
              <span style={{ marginLeft: '8px', fontSize: '12px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px', backgroundColor: '#FEF2F2', color: '#E24B4A' }}>
                {stats.pendingApprovals} waiting
              </span>
            )}
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/pm/procurement/orders" style={{ fontSize: '13px', color: '#00236F', textDecoration: 'none', padding: '8px 14px', border: '0.5px solid #00236F', borderRadius: '8px' }}>
              View orders
            </Link>
            <Link href="/pm/procurement/variance" style={{ fontSize: '13px', color: '#00236F', textDecoration: 'none', padding: '8px 14px', border: '0.5px solid #00236F', borderRadius: '8px' }}>
              Price variance
            </Link>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: '100px', backgroundColor: '#EEEEEE', borderRadius: '12px' }} className="animate-pulse" />
            ))}
          </div>
        ) : pendingRequests.length === 0 ? (
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '0.5px solid #EEEEEE', padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#E4E9FA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00236F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p style={{ fontSize: '16px', fontWeight: '600', color: '#111111', marginBottom: '8px' }}>All caught up</p>
            <p style={{ fontSize: '14px', color: '#BBBBBB' }}>No purchase requests waiting for your approval.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '0.5px solid #EEEEEE',
                  padding: '20px',
                  borderLeft: `3px solid ${priorityColour[request.priority] ?? '#BBBBBB'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px', backgroundColor: (priorityColour[request.priority] ?? '#BBBBBB') + '22', color: priorityColour[request.priority] ?? '#BBBBBB', textTransform: 'capitalize' }}>
                        {request.priority}
                      </span>
                      <span style={{ fontSize: '11px', color: '#BBBBBB' }}>{request.project_name}</span>
                    </div>
                    <p style={{ fontSize: '16px', fontWeight: '600', color: '#111111', marginBottom: '4px' }}>{request.title}</p>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#666666', flexWrap: 'wrap' }}>
                      <span>By {request.requester_name}</span>
                      {request.required_by_date && (
                        <span>Required by {new Date(request.required_by_date).toLocaleDateString('en-RW', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      )}
                      {request.total_estimated_cost != null && (
                        <span>Est. {formatCurrency(request.total_estimated_cost)}</span>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/pm/procurement/requests/${request.id}`}
                    style={{ fontSize: '13px', color: '#00236F', textDecoration: 'none', padding: '6px 12px', border: '0.5px solid #EEEEEE', borderRadius: '6px', flexShrink: 0 }}
                  >
                    View details
                  </Link>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => handleApprove(request.id)}
                    disabled={approvingId === request.id}
                    style={{
                      padding: '8px 20px',
                      backgroundColor: approvingId === request.id ? '#BBBBBB' : '#00236F',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: approvingId === request.id ? 'not-allowed' : 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    {approvingId === request.id ? 'Approving...' : 'Approve'}
                  </button>

                  <input
                    type="text"
                    placeholder="Rejection reason (required to reject)"
                    value={rejectionReasons[request.id] ?? ''}
                    onChange={(e) => setRejectionReasons((prev) => ({ ...prev, [request.id]: e.target.value }))}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      fontSize: '13px',
                      borderRadius: '8px',
                      border: '0.5px solid #EEEEEE',
                      backgroundColor: '#F5F6FA',
                      color: '#111111',
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                    onFocus={(e) => { e.target.style.border = '1.5px solid #E24B4A' }}
                    onBlur={(e) => { e.target.style.border = '0.5px solid #EEEEEE' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleReject(request.id)}
                    disabled={rejectingId === request.id}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#FFFFFF',
                      color: '#E24B4A',
                      border: '0.5px solid #E24B4A',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: rejectingId === request.id ? 'not-allowed' : 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    {rejectingId === request.id ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
