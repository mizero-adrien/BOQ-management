'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'

interface BOQItemOption {
  id: string
  description: string
  unit: string
  quantity: number
  used_quantity: number
  section_title: string
}

interface Project {
  id: string
  name: string
  pm_id: string
}

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  fontSize: '14px',
  borderRadius: '8px',
  border: '1px solid #EEEEEE',
  backgroundColor: '#F5F6FA',
  color: '#111111',
  outline: 'none',
  fontFamily: 'inherit',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '600',
  color: '#111111',
  marginBottom: '6px',
}

export default function StockInPage() {
  const [project, setProject] = useState<Project | null>(null)
  const [boqItems, setBOQItems] = useState<BOQItemOption[]>([])
  const [loadingProject, setLoadingProject] = useState(true)
  const [loadingItems, setLoadingItems] = useState(false)

  const [selectedItemId, setSelectedItemId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [supplierName, setSupplierName] = useState('')
  const [deliveryNote, setDeliveryNote] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const selectedItem = boqItems.find((i) => i.id === selectedItemId)

  useEffect(() => {
    async function fetchProjectAndItems() {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('[stock-in] no authenticated user')
        setLoadingProject(false)
        return
      }

      console.log('[stock-in] user id:', user.id)

      // Step 1 — find which projects this user is a member of
      const { data: memberData, error: memberError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id)
        .limit(10)

      console.log('[stock-in] memberships:', memberData, 'error:', memberError)

      if (memberError || !memberData || memberData.length === 0) {
        console.error('[stock-in] no project memberships found')
        setLoadingProject(false)
        return
      }

      const projectIds = memberData.map((m: { project_id: string }) => m.project_id)

      // Step 2 — find the active project from those memberships
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id, name, pm_id')
        .in('id', projectIds)
        .eq('status', 'active')
        .limit(1)
        .single()

      console.log('[stock-in] project:', projectData, 'error:', projectError)

      if (projectError || !projectData) {
        console.error('[stock-in] no active project found')
        setLoadingProject(false)
        return
      }

      setProject(projectData as Project)
      setLoadingProject(false)
      setLoadingItems(true)

      // Step 3 — fetch BOQ sections for the project
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('boq_sections')
        .select('id, title')
        .eq('project_id', projectData.id)
        .order('order_index', { ascending: true })

      console.log('[stock-in] sections:', sectionsData, 'error:', sectionsError)

      if (sectionsError || !sectionsData || sectionsData.length === 0) {
        console.error('[stock-in] no BOQ sections found')
        setLoadingItems(false)
        return
      }

      const sectionIds = sectionsData.map((s: { id: string }) => s.id)
      const sectionMap = Object.fromEntries(
        sectionsData.map((s: { id: string; title: string }) => [s.id, s.title])
      )

      // Step 4 — fetch BOQ items within those sections
      const { data: itemsData, error: itemsError } = await supabase
        .from('boq_items')
        .select('id, description, unit, quantity, used_quantity, section_id')
        .in('section_id', sectionIds)
        .order('description', { ascending: true })

      console.log('[stock-in] items:', itemsData, 'error:', itemsError)

      if (itemsError || !itemsData) {
        console.error('[stock-in] items error:', itemsError?.message)
        setLoadingItems(false)
        return
      }

      const items: BOQItemOption[] = itemsData.map((item: {
        id: string
        description: string
        unit: string
        quantity: number
        used_quantity: number
        section_id: string
      }) => ({
        id: item.id,
        description: item.description,
        unit: item.unit,
        quantity: item.quantity,
        used_quantity: item.used_quantity,
        section_title: sectionMap[item.section_id] ?? 'Unknown section',
      }))

      console.log('[stock-in] built', items.length, 'items')
      setBOQItems(items)
      setLoadingItems(false)
    }

    fetchProjectAndItems()
  }, [])

  async function handleSubmit() {
    if (!selectedItemId) { toast.error('No item selected', 'Please select a BOQ item'); return }
    if (!quantity || Number(quantity) <= 0) { toast.error('Invalid quantity', 'Please enter a valid quantity'); return }
    if (!project) { toast.error('No project', 'No active project found'); return }

    setSubmitting(true)

    try {
      const supabase = createClient()

      const bodyParts = [
        `${quantity} ${selectedItem?.unit ?? ''} of ${selectedItem?.description ?? ''} received.`,
        supplierName ? `Supplier: ${supplierName}.` : '',
        deliveryNote ? `Delivery note: ${deliveryNote}.` : '',
        notes ? notes : '',
      ].filter(Boolean).join(' ')

      await supabase.from('notifications').insert({
        user_id: project.pm_id,
        project_id: project.id,
        type: 'comment_added',
        title: 'Stock received at site store',
        body: bodyParts,
        read: false,
      })

      toast.success('Stock recorded', 'The project manager has been notified.')
      setSelectedItemId('')
      setQuantity('')
      setSupplierName('')
      setDeliveryNote('')
      setNotes('')
    } catch (err) {
      console.error('[stock-in] submit error:', err)
      toast.error('Unexpected error', 'An unexpected error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingProject) {
    return (
      <div style={{ backgroundColor: '#F5F6FA', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #EEEEEE', borderTopColor: '#00236F', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ fontSize: '14px', color: '#666666' }}>Loading...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div style={{ backgroundColor: '#F5F6FA', minHeight: '100vh', padding: '32px 20px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '0.5px solid #EEEEEE', padding: '32px', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', fontWeight: '600', color: '#111111', marginBottom: '8px' }}>No active project</p>
          <p style={{ fontSize: '14px', color: '#666666' }}>You are not assigned to any active project. Ask your project manager to add you.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#F5F6FA', minHeight: '100vh', padding: '32px 20px' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>

        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111111', marginBottom: '4px' }}>Record Stock In</h1>
          <p style={{ fontSize: '14px', color: '#666666' }}>{project.name}</p>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '0.5px solid #EEEEEE', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>
              BOQ Item <span style={{ color: '#E24B4A' }}>*</span>
            </label>
            {loadingItems ? (
              <div style={{ ...fieldStyle, color: '#BBBBBB' }}>Loading items...</div>
            ) : boqItems.length === 0 ? (
              <div style={{ ...fieldStyle, color: '#BBBBBB' }}>No BOQ items found for this project</div>
            ) : (
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                style={fieldStyle}
                onFocus={(e) => { e.target.style.border = '1.5px solid #00236F' }}
                onBlur={(e) => { e.target.style.border = '1px solid #EEEEEE' }}
              >
                <option value="">Select a BOQ item</option>
                {boqItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.section_title} — {item.description} ({item.unit})
                  </option>
                ))}
              </select>
            )}

            {selectedItem && (
              <div style={{ marginTop: '8px', backgroundColor: '#E4E9FA', borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#00236F' }}>
                  <span>Budgeted: {selectedItem.quantity} {selectedItem.unit}</span>
                  <span>Used: {selectedItem.used_quantity} {selectedItem.unit}</span>
                  <span>Remaining: {Math.max(0, selectedItem.quantity - selectedItem.used_quantity)} {selectedItem.unit}</span>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>
              Quantity received <span style={{ color: '#E24B4A' }}>*</span>
              {selectedItem && <span style={{ fontWeight: '400', color: '#BBBBBB' }}> ({selectedItem.unit})</span>}
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              min="0"
              step="0.001"
              style={fieldStyle}
              onFocus={(e) => { e.target.style.border = '1.5px solid #00236F' }}
              onBlur={(e) => { e.target.style.border = '1px solid #EEEEEE' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>
              Supplier name <span style={{ fontSize: '11px', fontWeight: '400', color: '#BBBBBB' }}>optional</span>
            </label>
            <input
              type="text"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="e.g. Kigali Cement Ltd"
              style={fieldStyle}
              onFocus={(e) => { e.target.style.border = '1.5px solid #00236F' }}
              onBlur={(e) => { e.target.style.border = '1px solid #EEEEEE' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>
              Delivery note number <span style={{ fontSize: '11px', fontWeight: '400', color: '#BBBBBB' }}>optional</span>
            </label>
            <input
              type="text"
              value={deliveryNote}
              onChange={(e) => setDeliveryNote(e.target.value)}
              placeholder="e.g. DN-2026-001"
              style={fieldStyle}
              onFocus={(e) => { e.target.style.border = '1.5px solid #00236F' }}
              onBlur={(e) => { e.target.style.border = '1px solid #EEEEEE' }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>
              Notes <span style={{ fontSize: '11px', fontWeight: '400', color: '#BBBBBB' }}>optional</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about this delivery"
              rows={3}
              style={{ ...fieldStyle, resize: 'vertical', lineHeight: '1.5' }}
              onFocus={(e) => { e.target.style.border = '1.5px solid #00236F' }}
              onBlur={(e) => { e.target.style.border = '1px solid #EEEEEE' }}
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: submitting ? '#BBBBBB' : '#00236F',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Recording...' : 'Record receipt'}
          </button>

        </div>
      </div>
    </div>
  )
}
