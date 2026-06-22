'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

interface MemberOption {
  id: string
  full_name: string
  role: string
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

export default function StockOutPage() {
  const router = useRouter()

  const [project, setProject] = useState<Project | null>(null)
  const [boqItems, setBOQItems] = useState<BOQItemOption[]>([])
  const [members, setMembers] = useState<MemberOption[]>([])
  const [loadingProject, setLoadingProject] = useState(true)
  const [loadingItems, setLoadingItems] = useState(false)

  const [selectedItemId, setSelectedItemId] = useState('')
  const [qty, setQty] = useState(1)
  const [issuedTo, setIssuedTo] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const selectedItem = boqItems.find((i) => i.id === selectedItemId)

  useEffect(() => {
    async function fetchProjectAndItems() {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoadingProject(false); return }

      const { data: memberData, error: memberError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id)
        .limit(10)

      if (memberError || !memberData || memberData.length === 0) {
        setLoadingProject(false)
        return
      }

      const projectIds = memberData.map((m: { project_id: string }) => m.project_id)

      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id, name, pm_id')
        .in('id', projectIds)
        .eq('status', 'active')
        .limit(1)
        .single()

      if (projectError || !projectData) {
        setLoadingProject(false)
        return
      }

      setProject(projectData as Project)
      setLoadingProject(false)
      setLoadingItems(true)

      const { data: sectionsData } = await supabase
        .from('boq_sections')
        .select('id, title')
        .eq('project_id', projectData.id)
        .order('order_index', { ascending: true })

      const sections = sectionsData ?? []

      if (sections.length > 0) {
        const sectionIds = sections.map((s: { id: string }) => s.id)
        const sectionMap = Object.fromEntries(
          sections.map((s: { id: string; title: string }) => [s.id, s.title])
        )

        const { data: itemsData } = await supabase
          .from('boq_items')
          .select('id, description, unit, quantity, used_quantity, section_id')
          .in('section_id', sectionIds)
          .order('description', { ascending: true })

        const items: BOQItemOption[] = (itemsData ?? []).map((item: {
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

        setBOQItems(items)
        if (items.length > 0) setSelectedItemId(items[0].id)
      }

      setLoadingItems(false)

      const { data: memberRows } = await supabase
        .from('project_members')
        .select('user_id, role, profiles(full_name)')
        .eq('project_id', projectData.id)
        .in('role', ['engineer', 'foreman', 'storekeeper', 'pm', 'qs'])

      const teamMembers: MemberOption[] = (memberRows ?? []).map((m: {
        user_id: string
        role: string
        profiles: { full_name: string } | { full_name: string }[] | null
      }) => {
        const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
        return {
          id: m.user_id,
          full_name: p?.full_name ?? 'Unknown',
          role: m.role,
        }
      })

      setMembers(teamMembers)
    }

    fetchProjectAndItems()
  }, [])

  async function handleSubmit() {
    if (!selectedItemId) { toast.error('No item selected', 'Please select a BOQ item'); return }
    if (qty <= 0) { toast.error('Invalid quantity', 'Quantity must be greater than 0'); return }
    if (!project) { toast.error('No project', 'No active project found'); return }

    setSubmitting(true)

    try {
      const supabase = createClient()

      const recipientName = issuedTo
        ? (members.find((m) => m.id === issuedTo)?.full_name ?? issuedTo)
        : 'General site use'

      const notesText = [
        `Issued to: ${recipientName}`,
        notes || '',
      ].filter(Boolean).join(' | ')

      const { error: logError } = await supabase.from('material_logs').insert({
        report_id: null,
        boq_item_id: selectedItemId,
        quantity_used: qty,
        cost_rwf: 0,
        notes: notesText,
      })

      if (logError) {
        const { error: retryError } = await supabase.from('material_logs').insert({
          report_id: null,
          boq_item_id: selectedItemId,
          quantity_used: qty,
          cost_rwf: 0,
        })
        if (retryError) {
          toast.error('Failed to record issuance', 'Please try again.')
          setSubmitting(false)
          return
        }
      }

      const notifTitle = `${selectedItem?.description ?? 'Material'} issued`
      const notifBody = `${qty} ${selectedItem?.unit ?? 'unit'} — ${recipientName}`

      await supabase.from('notifications').insert({
        user_id: project.pm_id,
        project_id: project.id,
        type: 'material_issued',
        title: notifTitle,
        body: notifBody,
        read: false,
        action_url: `/pm/boq`,
      })

      const { data: qsMembers } = await supabase
        .from('project_members')
        .select('user_id')
        .eq('project_id', project.id)
        .eq('role', 'qs')

      if (qsMembers && qsMembers.length > 0) {
        await supabase.from('notifications').insert(
          qsMembers.map((m: { user_id: string }) => ({
            user_id: m.user_id,
            project_id: project.id,
            type: 'material_issued',
            title: notifTitle,
            body: notifBody,
            read: false,
            action_url: `/qs/costs`,
          }))
        )
      }

      toast.success('Issuance recorded', 'BOQ updated automatically')
      router.push('/storekeeper/dashboard')
    } catch {
      toast.error('Unexpected error', 'An unexpected error occurred. Please try again.')
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
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111111', marginBottom: '4px' }}>Record Stock Out</h1>
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
              Quantity {selectedItem ? `(${selectedItem.unit})` : ''} <span style={{ color: '#E24B4A' }}>*</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                style={{ width: '44px', height: '44px', borderRadius: '8px', border: '1px solid #EEEEEE', backgroundColor: '#F5F6FA', color: '#111111', fontSize: '20px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                −
              </button>
              <input
                type="number"
                min="1"
                step="0.001"
                value={qty}
                onChange={(e) => {
                  const v = parseFloat(e.target.value)
                  if (!isNaN(v) && v > 0) setQty(v)
                }}
                style={{ ...fieldStyle, textAlign: 'center', fontSize: '20px', fontWeight: '700', color: '#00236F', width: '96px', flexShrink: 0 }}
                onFocus={(e) => { e.target.style.border = '1.5px solid #00236F' }}
                onBlur={(e) => { e.target.style.border = '1px solid #EEEEEE' }}
              />
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                style={{ width: '44px', height: '44px', borderRadius: '8px', border: '1px solid #EEEEEE', backgroundColor: '#F5F6FA', color: '#111111', fontSize: '20px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                +
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>
              Issued to <span style={{ fontSize: '11px', fontWeight: '400', color: '#BBBBBB' }}>optional</span>
            </label>
            {members.length === 0 ? (
              <div style={{ ...fieldStyle, color: '#BBBBBB' }}>
                No team members found — add team members via the PM team page
              </div>
            ) : (
              <select
                value={issuedTo}
                onChange={(e) => setIssuedTo(e.target.value)}
                style={fieldStyle}
                onFocus={(e) => { e.target.style.border = '1.5px solid #00236F' }}
                onBlur={(e) => { e.target.style.border = '1px solid #EEEEEE' }}
              >
                <option value="">General site use</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name} ({m.role})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>
              Notes <span style={{ fontSize: '11px', fontWeight: '400', color: '#BBBBBB' }}>optional</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about this issuance"
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
            {submitting ? 'Recording...' : 'Record issuance'}
          </button>

        </div>
      </div>
    </div>
  )
}
