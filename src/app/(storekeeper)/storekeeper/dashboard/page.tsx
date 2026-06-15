'use client'

import Link from 'next/link'
import { useActiveProject } from '@/hooks/useActiveProject'
import { useBOQSections } from '@/hooks/useBOQSections'
import { useMaterialLogs } from '@/hooks/useMaterialLogs'
import { formatDate, formatCurrency } from '@/lib/utils/index'
import type { SectionWithItems } from '@/hooks/useBOQSections'
import type { BOQItem } from '@/types/database'
import { SkeletonStats, SkeletonTable } from '@/components/shared/Skeleton'

function LowStockItem({ item }: { item: BOQItem & { usage: number } }) {
  return (
    <div className="bg-white rounded-xl px-4 py-3.5 mb-2" style={{ border: '1px solid #E24B4A' }}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium" style={{ color: '#111111' }}>{item.description}</p>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: '#FFF5F5', color: '#E24B4A' }}>Low stock</span>
      </div>
      <p className="text-xs mt-1" style={{ color: '#666666' }}>
        {item.used_total.toFixed(0)} of {item.quantity} {item.unit} used ({item.usage}%)
      </p>
    </div>
  )
}

function getLowStockItems(sections: SectionWithItems[]) {
  return sections.flatMap((s) =>
    s.items
      .map((item) => ({
        ...item,
        usage: item.quantity > 0 ? Math.round((item.used_total / (item.quantity * item.unit_rate) ) * 100) : 0,
      }))
      .filter((item) => {
        const usagePct = item.budgeted_total > 0 ? (item.used_total / item.budgeted_total) : 0
        return usagePct > 0.8
      })
      .map((item) => ({
        ...item,
        usage: Math.round(item.budgeted_total > 0 ? (item.used_total / item.budgeted_total) * 100 : 0),
      }))
  )
}

export default function StorekeeperDashboardPage() {
  const { project } = useActiveProject()
  const { sections, loading: boqLoading } = useBOQSections(project?.id)
  const { logs } = useMaterialLogs(project?.id)

  const lowStockItems = getLowStockItems(sections)
  const todayStr = new Date().toISOString().slice(0, 10)
  const todayLogs = logs.filter((l) => l.loggedAt.startsWith(todayStr))
  const issuedToday = todayLogs.reduce((s, l) => s + l.quantityUsed, 0)
  const recentLogs = logs.slice(0, 10)

  if (boqLoading) {
    return (
      <div className="px-4 pt-6 md:px-8 md:pt-8" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <SkeletonStats count={2} />
        <SkeletonTable rows={4} />
      </div>
    )
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-8" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="mb-6">
        <h1 className="font-semibold mb-0.5" style={{ color: '#111111', fontSize: '24px' }}>Store Dashboard</h1>
        <p className="text-sm" style={{ color: '#666666' }}>{project?.name ?? 'Loading...'}</p>
      </div>

      {/* Low stock alerts */}
      <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#BBBBBB' }}>Stock Alerts</h2>
      {lowStockItems.length === 0 ? (
        <div className="rounded-xl px-4 py-3.5 mb-4" style={{ backgroundColor: '#E4E9FA' }}>
          <p className="text-sm font-semibold" style={{ color: '#00236F' }}>All stock levels are within budget</p>
        </div>
      ) : (
        <div className="mb-4">{lowStockItems.map((item) => <LowStockItem key={item.id} item={item} />)}</div>
      )}

      {/* Today's activity */}
      <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#BBBBBB' }}>Today's Activity</h2>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-xl p-4" style={{ border: '0.5px solid #EEEEEE' }}>
          <p className="text-2xl font-bold" style={{ color: '#00236F' }}>{issuedToday.toFixed(0)}</p>
          <p className="text-xs font-medium mt-0.5" style={{ color: '#111111' }}>Units issued today</p>
        </div>
        <div className="bg-white rounded-xl p-4" style={{ border: '0.5px solid #EEEEEE' }}>
          <p className="text-2xl font-bold" style={{ color: '#BBBBBB' }}>0</p>
          <p className="text-xs font-medium mt-0.5" style={{ color: '#111111' }}>Materials received</p>
          <p className="text-xs mt-0.5" style={{ color: '#BBBBBB' }}>Feature coming soon</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <Link href="/storekeeper/stock-in" className="block py-3.5 rounded-xl text-sm font-semibold text-white text-center" style={{ backgroundColor: '#00236F' }}>
          Log stock in
        </Link>
        <Link href="/storekeeper/stock-out" className="block py-3.5 rounded-xl text-sm font-semibold text-center" style={{ border: '1px solid #00236F', color: '#00236F' }}>
          Log stock out
        </Link>
      </div>

      {/* Recent logs */}
      <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#BBBBBB' }}>Recent Logs</h2>
      {recentLogs.length === 0 ? (
        <div className="bg-white rounded-xl p-5 text-center" style={{ border: '0.5px solid #EEEEEE' }}>
          <p className="text-sm" style={{ color: '#BBBBBB' }}>No material logs yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: '0.5px solid #EEEEEE' }}>
          {recentLogs.map((log, i) => (
            <div key={log.id} className={`flex items-center gap-3 px-4 py-3 ${i < recentLogs.length - 1 ? 'border-b' : ''}`}
              style={{ borderColor: '#EEEEEE' }}>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: '#111111' }}>{log.itemDescription}</p>
                <p className="text-xs mt-0.5" style={{ color: '#666666' }}>{log.engineerName} — {formatDate(log.loggedAt)}</p>
              </div>
              <p className="text-xs font-semibold flex-shrink-0" style={{ color: '#00236F' }}>{log.quantityUsed} {log.unit}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
