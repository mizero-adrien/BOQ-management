'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders'
import { usePurchaseRequests } from '@/hooks/usePurchaseRequests'
import OrderCard from '@/components/procurement/OrderCard'
import DeliveryModal from '@/components/procurement/DeliveryModal'
import type { DeliveryItem } from '@/hooks/usePurchaseOrders'
import type { PurchaseRequestItem } from '@/hooks/usePurchaseRequests'
import { createClient } from '@/lib/supabase/client'

const TABS = ['all', 'pending', 'overdue', 'delivered'] as const
type Tab = typeof TABS[number]

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [deliveryOrderId, setDeliveryOrderId] = useState<string | null>(null)
  const [deliveryItems, setDeliveryItems] = useState<PurchaseRequestItem[]>([])
  const { orders, loading, recordDelivery } = usePurchaseOrders()
  const { requests: _requests } = usePurchaseRequests()
  void _requests

  const today = new Date().toISOString().slice(0, 10)

  const displayOrders = (() => {
    if (activeTab === 'all') return orders
    if (activeTab === 'pending') return orders.filter((o) => !o.expected_delivery_date || o.expected_delivery_date >= today)
    if (activeTab === 'overdue') return orders.filter((o) => o.expected_delivery_date && o.expected_delivery_date < today)
    return orders
  })()

  async function handleOpenDelivery(orderId: string) {
    const order = orders.find((o) => o.id === orderId)
    if (!order) return
    const supabase = createClient()
    const { data } = await supabase
      .from('purchase_request_items').select('*').eq('request_id', order.request_id)
    setDeliveryItems((data ?? []) as PurchaseRequestItem[])
    setDeliveryOrderId(orderId)
  }

  async function handleRecord(orderId: string, items: DeliveryItem[], notes?: string): Promise<boolean> {
    const ok = await recordDelivery(orderId, items, notes)
    if (ok) setDeliveryOrderId(null)
    return ok
  }

  return (
    <div style={{ backgroundColor: '#F5F6FA', minHeight: '100vh', padding: '32px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111111', marginBottom: '4px' }}>
            Purchase Orders
          </h1>
          <p style={{ fontSize: '14px', color: '#666666' }}>{orders.length} total</p>
        </div>

        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{ padding: '7px 14px', borderRadius: '20px', fontSize: '13px', whiteSpace: 'nowrap',
                fontWeight: activeTab === tab ? '600' : '400',
                backgroundColor: activeTab === tab ? '#00236F' : '#FFFFFF',
                color: activeTab === tab ? '#FFFFFF' : '#666666',
                border: activeTab === tab ? 'none' : '1px solid #EEEEEE', cursor: 'pointer' }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          [1, 2].map((i) => (
            <div key={i} className="rounded-xl animate-pulse mb-3" style={{ height: '120px', backgroundColor: '#EEEEEE' }} />
          ))
        ) : displayOrders.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#BBBBBB', padding: '60px 0', fontSize: '14px' }}>
            No orders found
          </p>
        ) : (
          <div className="space-y-3">
            {displayOrders.map((o) => (
              <OrderCard key={o.id} order={o} onRecordDelivery={handleOpenDelivery} />
            ))}
          </div>
        )}
      </div>

      {deliveryOrderId && (
        <DeliveryModal
          orderId={deliveryOrderId}
          items={deliveryItems}
          onRecord={handleRecord}
          onClose={() => setDeliveryOrderId(null)}
        />
      )}
    </div>
  )
}
