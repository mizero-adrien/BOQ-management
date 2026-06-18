'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders'
import { useSuppliers } from '@/hooks/useSuppliers'

function generatePONumber(): string {
  const date = new Date()
  const y = date.getFullYear().toString().slice(2)
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const rand = Math.floor(Math.random() * 9000 + 1000)
  return `PO-${y}${m}-${rand}`
}

const F: React.CSSProperties = {
  width: '100%', padding: '12px', fontSize: '14px', borderRadius: '8px',
  border: '1px solid #EEEEEE', backgroundColor: '#F5F6FA', color: '#111111', outline: 'none',
}

const L: React.CSSProperties = {
  display: 'block', fontSize: '13px', fontWeight: 600, color: '#111111', marginBottom: '6px',
}

function NewOrderForm() {
  const router = useRouter()
  const params = useSearchParams()
  const requestId = params.get('requestId') ?? ''
  const { createOrder } = usePurchaseOrders(requestId || undefined)
  const { suppliers } = useSuppliers()
  const [requestTitle, setRequestTitle] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [poNumber] = useState(generatePONumber)
  const [totalAmount, setTotalAmount] = useState('')
  const [expectedDate, setExpectedDate] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!requestId) return
    const supabase = createClient()
    supabase.from('purchase_requests').select('title').eq('id', requestId).single()
      .then(({ data }) => {
        if (data) setRequestTitle((data as { title: string }).title)
      })
  }, [requestId])

  async function handleSubmit() {
    if (!supplierId || !totalAmount || !requestId) return
    setSaving(true)
    const id = await createOrder({
      requestId,
      supplierId,
      poNumber,
      totalAmount: parseFloat(totalAmount),
      expectedDeliveryDate: expectedDate || undefined,
      notes: notes || undefined,
    })
    setSaving(false)
    if (id) router.push('/procurement/orders')
  }

  return (
    <div style={{ backgroundColor: '#F5F6FA', minHeight: '100vh', padding: '32px 20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <button type="button" onClick={() => router.back()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666666',
            marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back
        </button>

        <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#111111', marginBottom: '4px' }}>
          Create Purchase Order
        </h1>
        {requestTitle && (
          <p style={{ fontSize: '14px', color: '#666666', marginBottom: '24px' }}>For: {requestTitle}</p>
        )}

        <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #EEEEEE' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={L}>PO Number</label>
            <div style={{ ...F, backgroundColor: '#FFFFFF', color: '#666666' }}>{poNumber}</div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={L}>Supplier <span style={{ color: '#E24B4A' }}>*</span></label>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} style={F}>
              <option value="">Select supplier</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={L}>Total amount (RWF) <span style={{ color: '#E24B4A' }}>*</span></label>
            <input type="number" min={0} value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)} placeholder="0" style={F} />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={L}>Expected delivery date</label>
            <input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} style={F} />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={L}>Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              style={{ ...F, resize: 'none' as const, lineHeight: '1.5' }} />
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !supplierId || !totalAmount}
            style={{ width: '100%', padding: '14px',
              backgroundColor: saving || !supplierId || !totalAmount ? '#BBBBBB' : '#00236F',
              color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '14px',
              fontWeight: '600', cursor: 'pointer' }}
          >
            {saving ? 'Creating...' : 'Create purchase order'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '32px' }}>
        <div className="animate-pulse" style={{ height: '200px', backgroundColor: '#EEEEEE', borderRadius: '12px' }} />
      </div>
    }>
      <NewOrderForm />
    </Suspense>
  )
}
