'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { usePMProjects } from '@/hooks/usePMProjects'
import { formatCurrency } from '@/lib/utils'
import ProcurementSubNav from '@/components/pm/procurement/ProcurementSubNav'

type StatusFilter = 'all' | 'pending_approval' | 'approved' | 'rejected' | 'ordered' | 'delivered'

interface RequestRow {
  id: string
  title: string
  status: string
  priority: string
  required_by_date: string | null
  total_estimated_cost: number | null
  requester_name: string
  project_name: string
  created_at: string
}

const statusColour: Record<string, { bg: string; text: string }> = {
  draft: { bg: '#F5F6FA', text: '#666666' },
  pending_approval: { bg: '#FEF2F2', text: '#E24B4A' },
  approved: { bg: '#E4E9FA', text: '#00236F' },
  rejected: { bg: '#FEF2F2', text: '#E24B4A' },
  ordered: { bg: '#E4E9FA', text: '#00236F' },
  partially_delivered: { bg: '#F5F6FA', text: '#666666' },
  delivered: { bg: '#F5F6FA', text: '#111111' },
  cancelled: { bg: '#F5F6FA', text: '#BBBBBB' },
}

const filters: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending approval', value: 'pending_approval' },
  { label: 'Approved', value: 'approved' },
  { label: 'Ordered', value: 'ordered' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Delivered', value: 'delivered' },
]

export default function PMProcurementRequestsPage() {
  const { projects, loading: projectsLoading } = usePMProjects()
  const [requests, setRequests] = useState<RequestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<StatusFilter>('all')

  useEffect(() => {
    if (projectsLoading) return
    if (projects.length === 0) { setLoading(false); return }

    async function fetchRequests() {
      setLoading(true)
      const supabase = createClient()
      const projectIds = projects.map((p) => p.id)

      let query = supabase
        .from('purchase_requests')
        .select('id, title, status, priority, required_by_date, total_estimated_cost, created_at, requested_by, project_id')
        .in('project_id', projectIds)
        .order('created_at', { ascending: false })

      if (filter !== 'all') query = query.eq('status', filter)

      const { data, error } = await query
      if (error) { setLoading(false); return }

      const rows = data ?? []
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

      setRequests(rows.map((r: {
        id: string
        title: string
        status: string
        priority: string
        required_by_date: string | null
        total_estimated_cost: number | null
        created_at: string
        requested_by: string
        project_id: string
      }) => ({
        id: r.id,
        title: r.title,
        status: r.status,
        priority: r.priority ?? 'normal',
        required_by_date: r.required_by_date,
        total_estimated_cost: r.total_estimated_cost,
        requester_name: nameMap[r.requested_by] ?? 'Unknown',
        project_name: projMap[r.project_id] ?? '',
        created_at: r.created_at,
      })))
      setLoading(false)
    }

    fetchRequests()
  }, [projects, projectsLoading, filter])

  return (
    <>
      <ProcurementSubNav />
      <div style={{ padding: '32px 24px', maxWidth: '960px', margin: '0 auto' }}>

        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111111', marginBottom: '4px' }}>Purchase Requests</h1>
          <p style={{ fontSize: '14px', color: '#666666' }}>All procurement requests across your projects</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: filter === f.value ? '600' : '400',
                color: filter === f.value ? '#FFFFFF' : '#666666',
                backgroundColor: filter === f.value ? '#00236F' : '#FFFFFF',
                border: `0.5px solid ${filter === f.value ? '#00236F' : '#EEEEEE'}`,
                cursor: 'pointer',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: '80px', backgroundColor: '#EEEEEE', borderRadius: '10px' }} className="animate-pulse" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '0.5px solid #EEEEEE', padding: '48px', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', fontWeight: '600', color: '#111111', marginBottom: '8px' }}>No requests found</p>
            <p style={{ fontSize: '14px', color: '#BBBBBB' }}>No purchase requests match this filter.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {requests.map((r) => {
              const colours = statusColour[r.status] ?? { bg: '#F5F6FA', text: '#666666' }
              return (
                <Link key={r.id} href={`/pm/procurement/requests/${r.id}`} style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '10px',
                      border: '0.5px solid #EEEEEE',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <p style={{ fontSize: '15px', fontWeight: '500', color: '#111111' }}>{r.title}</p>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '500',
                            padding: '2px 8px',
                            borderRadius: '20px',
                            backgroundColor: colours.bg,
                            color: colours.text,
                            textTransform: 'capitalize',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {r.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#BBBBBB' }}>
                        {r.project_name}
                        {r.requester_name ? ` — ${r.requester_name}` : ''}
                        {r.required_by_date ? ` — Required by ${new Date(r.required_by_date).toLocaleDateString('en-RW', { day: 'numeric', month: 'short' })}` : ''}
                      </p>
                    </div>
                    {r.total_estimated_cost != null && (
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#00236F', flexShrink: 0 }}>
                        {formatCurrency(r.total_estimated_cost)}
                      </p>
                    )}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#BBBBBB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
