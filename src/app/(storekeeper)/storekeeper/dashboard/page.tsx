'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useActiveProject } from '@/hooks/useActiveProject'
import { useMaterialLogs } from '@/hooks/useMaterialLogs'
import { formatDate } from '@/lib/utils/index'

function LogsEmptyState() {
  return (
    <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '0.5px solid #EEEEEE', padding: '40px 32px', textAlign: 'center' }}>
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#BBBBBB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <line x1="9" y1="12" x2="15" y2="12" />
        <line x1="9" y1="16" x2="13" y2="16" />
      </svg>
      <p style={{ marginTop: '12px', fontSize: '14px', fontWeight: '600', color: '#111111' }}>No material logs yet</p>
      <p style={{ marginTop: '4px', fontSize: '12px', color: '#BBBBBB' }}>Record your first stock movement to start tracking.</p>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px' }}>
        <Link href="/storekeeper/stock-out" style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '600', color: '#FFFFFF', backgroundColor: '#00236F', borderRadius: '8px', textDecoration: 'none' }}>
          Log stock out
        </Link>
        <Link href="/storekeeper/stock-in" style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '600', color: '#00236F', backgroundColor: '#E4E9FA', borderRadius: '8px', textDecoration: 'none' }}>
          Log stock in
        </Link>
      </div>
    </div>
  )
}

interface LowStockItem {
  id: string
  description: string
  unit: string
  quantity: number
  used_quantity: number
  usage: number
}

export default function StorekeeperDashboardPage() {
  const { project, loading: projectLoading } = useActiveProject()
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([])

  const { logs, loading: logsLoading } = useMaterialLogs(project?.id)

  useEffect(() => {
    if (!project?.id) { setLowStockItems([]); return }

    async function fetchLowStock() {
      const supabase = createClient()

      const { data: sectionsData } = await supabase
        .from('boq_sections')
        .select('id')
        .eq('project_id', project!.id)

      if (!sectionsData || sectionsData.length === 0) return

      const sectionIds = sectionsData.map((s: { id: string }) => s.id)

      const { data: itemsData } = await supabase
        .from('boq_items')
        .select('id, description, unit, quantity, used_quantity')
        .in('section_id', sectionIds)

      if (itemsData) {
        const low = itemsData
          .filter((item: { quantity: number; used_quantity: number }) =>
            item.quantity > 0 && (item.used_quantity / item.quantity) > 0.8
          )
          .map((item: { id: string; description: string; unit: string; quantity: number; used_quantity: number }) => ({
            id: item.id,
            description: item.description,
            unit: item.unit,
            quantity: item.quantity,
            used_quantity: item.used_quantity,
            usage: Math.round((item.used_quantity / item.quantity) * 100),
          }))
        setLowStockItems(low)
      }
    }

    fetchLowStock()
  }, [project?.id])

  const todayStr = new Date().toISOString().slice(0, 10)
  const todayLogs = logs.filter((l) => l.loggedAt.startsWith(todayStr))
  const issuedToday = todayLogs.reduce((sum, l) => sum + l.quantityUsed, 0)
  const recentLogs = logs.slice(0, 10)

  if (projectLoading || logsLoading) {
    return (
      <div style={{ backgroundColor: '#F5F6FA', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #EEEEEE', borderTopColor: '#1565D8', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ fontSize: '14px', color: '#666666' }}>Loading...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div style={{ backgroundColor: '#F5F6FA', minHeight: '100vh', padding: '32px 20px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '0.5px solid #EEEEEE', padding: '40px', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', fontWeight: '600', color: '#111111', marginBottom: '8px' }}>No active project</p>
          <p style={{ fontSize: '14px', color: '#666666' }}>You are not assigned to any active project. Ask your project manager to add you to a project.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div style={{ backgroundColor: '#F4F6F8', minHeight: '100vh', padding: '24px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        {/* Stock alerts */}
        <p style={{ fontSize: '11px', fontWeight: '600', color: '#BBBBBB', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>Stock Alerts</p>
        {lowStockItems.length === 0 ? (
          <div style={{ backgroundColor: '#E4E9FA', borderRadius: '10px', padding: '14px 16px', marginBottom: '20px' }}>
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#00236F' }}>All stock levels are within limits</p>
          </div>
        ) : (
          <div style={{ marginBottom: '20px' }}>
            {lowStockItems.map((item) => (
              <div key={item.id} style={{ backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid #E24B4A', padding: '14px 16px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: '#111111' }}>{item.description}</p>
                  <span style={{ fontSize: '11px', fontWeight: '600', backgroundColor: '#FFF5F5', color: '#E24B4A', padding: '3px 10px', borderRadius: '20px' }}>Low stock</span>
                </div>
                <p style={{ fontSize: '12px', color: '#666666' }}>
                  {item.used_quantity.toFixed(0)} of {item.quantity} {item.unit} used ({item.usage}%)
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Today's activity */}
        <p style={{ fontSize: '11px', fontWeight: '600', color: '#BBBBBB', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>Today's Activity</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '16px', border: '0.5px solid #EEEEEE' }}>
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#00236F', marginBottom: '2px' }}>{issuedToday.toFixed(0)}</p>
            <p style={{ fontSize: '12px', fontWeight: '500', color: '#111111' }}>Units issued today</p>
          </div>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '16px', border: '0.5px solid #EEEEEE' }}>
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#BBBBBB', marginBottom: '2px' }}>{todayLogs.length}</p>
            <p style={{ fontSize: '12px', fontWeight: '500', color: '#111111' }}>Log entries today</p>
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          <Link href="/storekeeper/stock-in" style={{ display: 'block', padding: '14px', backgroundColor: '#00236F', color: '#FFFFFF', borderRadius: '10px', fontSize: '14px', fontWeight: '600', textDecoration: 'none', textAlign: 'center' }}>
            Log stock in
          </Link>
          <Link href="/storekeeper/stock-out" style={{ display: 'block', padding: '14px', backgroundColor: '#FFFFFF', color: '#00236F', border: '1.5px solid #00236F', borderRadius: '10px', fontSize: '14px', fontWeight: '600', textDecoration: 'none', textAlign: 'center' }}>
            Log stock out
          </Link>
        </div>

        {/* Recent logs */}
        <p style={{ fontSize: '11px', fontWeight: '600', color: '#BBBBBB', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>Recent Logs</p>
        {recentLogs.length === 0 ? (
          <LogsEmptyState />
        ) : (
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '0.5px solid #EEEEEE', overflow: 'hidden' }}>
            {recentLogs.map((log, i) => (
              <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: i < recentLogs.length - 1 ? '0.5px solid #EEEEEE' : 'none' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: '500', color: '#111111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.itemDescription}</p>
                  <p style={{ fontSize: '12px', color: '#666666', marginTop: '2px' }}>{log.engineerName} — {formatDate(log.loggedAt)}</p>
                </div>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#00236F', flexShrink: 0 }}>{log.quantityUsed} {log.unit}</p>
              </div>
            ))}
          </div>
        )}

      </div>
      </div>
    </>
  )
}
