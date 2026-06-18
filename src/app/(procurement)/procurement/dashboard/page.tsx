'use client'

export const dynamic = 'force-dynamic'

import { usePurchaseRequests } from '@/hooks/usePurchaseRequests'
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders'
import { useSuppliers } from '@/hooks/useSuppliers'
import ProcurementStatCards from '@/components/procurement/ProcurementStatCards'
import PendingApprovalsList from '@/components/procurement/PendingApprovalsList'
import OverdueDeliveriesList from '@/components/procurement/OverdueDeliveriesList'
import RecentProcurementActivity from '@/components/procurement/RecentProcurementActivity'

export default function ProcurementDashboardPage() {
  const { requests, loading: reqLoading } = usePurchaseRequests()
  const { orders, loading: ordLoading } = usePurchaseOrders()
  const { suppliers, loading: supLoading } = useSuppliers()

  const loading = reqLoading || ordLoading || supLoading

  const pendingApproval = requests.filter((r) => r.status === 'pending_approval')
  const activeOrders = orders.filter((o) => !o.expected_delivery_date ||
    new Date(o.expected_delivery_date) >= new Date())

  if (loading) {
    return (
      <div style={{ backgroundColor: '#F5F6FA', minHeight: '100vh', padding: '32px 20px' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl animate-pulse mb-3" style={{ height: '80px', backgroundColor: '#EEEEEE' }} />
        ))}
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#F5F6FA', minHeight: '100vh', padding: '32px 20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111111', marginBottom: '4px' }}>
            Procurement
          </h1>
          <p style={{ fontSize: '14px', color: '#666666' }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <ProcurementStatCards
          totalRequests={requests.length}
          pendingApproval={pendingApproval.length}
          activeOrders={activeOrders.length}
          supplierCount={suppliers.length}
        />

        {pendingApproval.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#111111', marginBottom: '12px' }}>
              Pending approval
            </h2>
            <PendingApprovalsList
              requests={pendingApproval}
              approveHref={(id) => `/procurement/requests/${id}`}
            />
          </div>
        )}

        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#111111', marginBottom: '12px' }}>
            Overdue deliveries
          </h2>
          <OverdueDeliveriesList orders={orders} />
        </div>

        <div>
          <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#111111', marginBottom: '12px' }}>
            Recent activity
          </h2>
          <RecentProcurementActivity requests={requests.slice(0, 8)} />
        </div>
      </div>
    </div>
  )
}
