'use client'

interface StatCardProps {
  label: string
  value: string | number
  alert?: boolean
}

function StatCard({ label, value, alert }: StatCardProps) {
  return (
    <div
      className="bg-white rounded-xl px-4 py-4"
      style={{ border: `1px solid ${alert ? '#E24B4A' : '#EEEEEE'}` }}
    >
      <p className="text-xs font-medium mb-1" style={{ color: '#666666' }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: alert ? '#E24B4A' : '#111111' }}>{value}</p>
    </div>
  )
}

interface Props {
  totalRequests: number
  pendingApproval: number
  activeOrders: number
  supplierCount: number
}

export default function ProcurementStatCards({ totalRequests, pendingApproval, activeOrders, supplierCount }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
      <StatCard label="Total requests" value={totalRequests} />
      <StatCard label="Pending approval" value={pendingApproval} alert={pendingApproval > 0} />
      <StatCard label="Active orders" value={activeOrders} />
      <StatCard label="Suppliers" value={supplierCount} />
    </div>
  )
}
