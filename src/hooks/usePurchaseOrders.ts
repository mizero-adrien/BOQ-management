'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'

export interface PurchaseOrder {
  id: string
  request_id: string
  supplier_id: string
  quote_id: string | null
  created_by: string
  po_number: string
  total_amount: number
  expected_delivery_date: string | null
  notes: string | null
  created_at: string
  supplier_name: string
  request_title: string
}

export interface CreateOrderParams {
  requestId: string
  supplierId: string
  quoteId?: string
  poNumber: string
  totalAmount: number
  expectedDeliveryDate?: string
  notes?: string
}

export interface DeliveryItem {
  requestItemId: string
  quantityReceived: number
}

export function usePurchaseOrders(requestId?: string) {
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    let query = supabase.from('purchase_orders').select('*').order('created_at', { ascending: false })
    if (requestId) query = query.eq('request_id', requestId)

    const { data: rawOrders, error } = await query
    if (error) { console.error('usePurchaseOrders:', error.message); setLoading(false); return }

    const rows = (rawOrders ?? []) as PurchaseOrder[]
    const supplierIds = [...new Set(rows.map((o) => o.supplier_id).filter(Boolean))]
    const requestIds = [...new Set(rows.map((o) => o.request_id).filter(Boolean))]

    const [suppliersRes, requestsRes] = await Promise.all([
      supplierIds.length > 0
        ? supabase.from('suppliers').select('id, name').in('id', supplierIds)
        : Promise.resolve({ data: [], error: null }),
      requestIds.length > 0
        ? supabase.from('purchase_requests').select('id, title').in('id', requestIds)
        : Promise.resolve({ data: [], error: null }),
    ])

    type NameRow = { id: string; name?: string; title?: string }
    const supplierMap = Object.fromEntries(((suppliersRes.data ?? []) as NameRow[]).map((s) => [s.id, s.name ?? '']))
    const reqMap = Object.fromEntries(((requestsRes.data ?? []) as NameRow[]).map((r) => [r.id, r.title ?? '']))

    setOrders(rows.map((o) => ({ ...o, supplier_name: supplierMap[o.supplier_id] ?? 'Unknown', request_title: reqMap[o.request_id] ?? 'Unknown' })))
    setLoading(false)
  }, [requestId])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  async function createOrder(params: CreateOrderParams): Promise<string | null> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: order, error } = await supabase.from('purchase_orders').insert({
      request_id: params.requestId, supplier_id: params.supplierId,
      quote_id: params.quoteId ?? null, created_by: user.id,
      po_number: params.poNumber, total_amount: params.totalAmount,
      expected_delivery_date: params.expectedDeliveryDate ?? null, notes: params.notes ?? null,
    }).select('id').single()

    if (error || !order) { toast.error('Could not create order', error?.message ?? 'Unknown error'); return null }

    await supabase.from('purchase_requests').update({ status: 'ordered' }).eq('id', params.requestId)
    toast.success('Purchase order created')
    await fetchOrders()
    return (order as { id: string }).id
  }

  async function recordDelivery(orderId: string, items: DeliveryItem[], notes?: string): Promise<boolean> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data: delivery, error: deliveryErr } = await supabase.from('deliveries').insert({
      order_id: orderId, received_by: user.id, notes: notes ?? null,
    }).select('id').single()

    if (deliveryErr || !delivery) { toast.error('Could not record delivery', deliveryErr?.message ?? 'Unknown error'); return false }

    const deliveryItems = items.map((item) => ({
      delivery_id: (delivery as { id: string }).id,
      request_item_id: item.requestItemId,
      quantity_received: item.quantityReceived,
    }))

    await supabase.from('delivery_items').insert(deliveryItems)
    toast.success('Delivery recorded')
    await fetchOrders()
    return true
  }

  return { orders, loading, createOrder, recordDelivery, refetch: fetchOrders }
}
