'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePMProjects } from '@/hooks/usePMProjects'
import { formatCurrency, formatDate } from '@/lib/utils'
import ProcurementSubNav from '@/components/pm/procurement/ProcurementSubNav'

type TabFilter = 'all' | 'pending' | 'overdue' | 'delivered'

interface OrderRow {
  id: string
  po_number: string
  request_title: string
  supplier_name: string
  total_amount: number
  expected_delivery_date: string | null
  status: string
  created_at: string
  project_name: string
}

const TABS: { label: string; value: TabFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Overdue', value: 'overdue' },
  { label: 'Delivered', value: 'delivered' },
]

const statusColour: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#E4E9FA', text: '#00236F' },
  delivered: { bg: '#F0FDF9', text: '#5DCAA5' },
  cancelled: { bg: '#F5F6FA', text: '#BBBBBB' },
}

export default function PMProcurementOrdersPage() {
  const { projects, loading: projectsLoading } = usePMProjects()
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabFilter>('all')

  useEffect(() => {
    if (projectsLoading) return
    if (projects.length === 0) { setLoading(false); return }
    fetchOrders()
  }, [projects, projectsLoading])

  async function fetchOrders() {
    setLoading(true)
    const supabase = createClient()
    const projectIds = projects.map((p) => p.id)

    const { data: requestRows } = await supabase
      .from('purchase_requests')
      .select('id, title, project_id')
      .in('project_id', projectIds)

    const rows = requestRows ?? []
    if (rows.length === 0) { setOrders([]); setLoading(false); return }

    type RequestRow = { id: string; title: string; project_id: string }
    const requestMap = Object.fromEntries((rows as RequestRow[]).map((r) => [r.id, r]))
    const requestIds = (rows as RequestRow[]).map((r) => r.id)

    const { data: orderRows } = await supabase
      .from('purchase_orders')
      .select('id, po_number, request_id, supplier_id, total_amount, expected_delivery_date, status, created_at')
      .in('request_id', requestIds)
      .order('created_at', { ascending: false })

    const oRows = orderRows ?? []
    const supplierIds = [...new Set((oRows as { supplier_id: string }[]).map((o) => o.supplier_id).filter(Boolean))]
    const allProjectIds = [...new Set((rows as RequestRow[]).map((r) => r.project_id))]

    const [suppliersRes, projectsRes] = await Promise.all([
      supplierIds.length > 0
        ? supabase.from('suppliers').select('id, name').in('id', supplierIds)
        : Promise.resolve({ data: [] }),
      allProjectIds.length > 0
        ? supabase.from('projects').select('id, name').in('id', allProjectIds)
        : Promise.resolve({ data: [] }),
    ])

    type NameRow = { id: string; name?: string }
    const supplierMap = Object.fromEntries(((suppliersRes.data ?? []) as NameRow[]).map((s) => [s.id, s.name ?? '']))
    const projMap = Object.fromEntries(((projectsRes.data ?? []) as NameRow[]).map((p) => [p.id, p.name ?? '']))

    const mapped: OrderRow[] = (oRows as {
      id: string
      po_number: string
      request_id: string
      supplier_id: string
      total_amount: number
      expected_delivery_date: string | null
      status: string
      created_at: string
    }[]).map((o) => ({
      id: o.id,
      po_number: o.po_number,
      request_title: requestMap[o.request_id]?.title ?? 'Unknown',
      supplier_name: supplierMap[o.supplier_id] ?? 'Unknown supplier',
      total_amount: Number(o.total_amount) || 0,
      expected_delivery_date: o.expected_delivery_date,
      status: o.status,
      created_at: o.created_at,
      project_name: projMap[requestMap[o.request_id]?.project_id ?? ''] ?? '',
    }))

    setOrders(mapped)
    setLoading(false)
  }

  const today = new Date().toISOString().split('T')[0]

  const displayed = (() => {
    if (tab === 'all') return orders
    if (tab === 'pending') return orders.filter((o) => o.status === 'pending' && (!o.expected_delivery_date || o.expected_delivery_date >= today))
    if (tab === 'overdue') return orders.filter((o) => o.status === 'pending' && o.expected_delivery_date && o.expected_delivery_date < today)
    if (tab === 'delivered') return orders.filter((o) => o.status === 'delivered')
    return orders
  })()

  const isOverdue = (o: OrderRow) => o.status === 'pending' && o.expected_delivery_date != null && o.expected_delivery_date < today

  return (
    <>
      <ProcurementSubNav />
      <div style={{ padding: '32px 24px', maxWidth: '960px', margin: '0 auto' }}>

        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111111', marginBottom: '4px' }}>Purchase Orders</h1>
          <p style={{ fontSize: '14px', color: '#666666' }}>Track orders placed by your procurement team</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              style={{
                padding: '7px 14px',
                borderRadius: '20px',
                fontSize: '13px',
                whiteSpace: 'nowrap',
                fontWeight: tab === t.value ? '600' : '400',
                backgroundColor: tab === t.value ? '#00236F' : '#FFFFFF',
                color: tab === t.value ? '#FFFFFF' : '#666666',
                border: `0.5px solid ${tab === t.value ? '#00236F' : '#EEEEEE'}`,
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: '110px', backgroundColor: '#EEEEEE', borderRadius: '12px' }} className="animate-pulse" />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '0.5px solid #EEEEEE', padding: '48px', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', fontWeight: '600', color: '#111111', marginBottom: '8px' }}>No orders found</p>
            <p style={{ fontSize: '14px', color: '#BBBBBB' }}>No purchase orders match this filter.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {displayed.map((o) => {
              const colours = statusColour[o.status] ?? { bg: '#F5F6FA', text: '#666666' }
              const overdue = isOverdue(o)
              return (
                <div
                  key={o.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '0.5px solid #EEEEEE',
                    padding: '20px',
                    borderLeft: overdue ? '3px solid #E24B4A' : '3px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <p style={{ fontSize: '15px', fontWeight: '600', color: '#111111' }}>{o.po_number}</p>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '500',
                            padding: '2px 8px',
                            borderRadius: '20px',
                            backgroundColor: overdue ? '#FEF2F2' : colours.bg,
                            color: overdue ? '#E24B4A' : colours.text,
                            textTransform: 'capitalize',
                          }}
                        >
                          {overdue ? 'Overdue' : o.status}
                        </span>
                      </div>
                      <p style={{ fontSize: '14px', color: '#666666', marginBottom: '6px' }}>{o.request_title}</p>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#BBBBBB', flexWrap: 'wrap' }}>
                        <span>{o.supplier_name}</span>
                        <span>{o.project_name}</span>
                        {o.expected_delivery_date && (
                          <span style={{ color: overdue ? '#E24B4A' : '#BBBBBB' }}>
                            Delivery: {formatDate(o.expected_delivery_date)}
                          </span>
                        )}
                        <span>Ordered {formatDate(o.created_at)}</span>
                      </div>
                    </div>
                    <p style={{ fontSize: '16px', fontWeight: '600', color: '#00236F', flexShrink: 0 }}>
                      {formatCurrency(o.total_amount)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
