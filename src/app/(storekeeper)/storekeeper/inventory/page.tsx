'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface InventoryItem {
  id: string
  description: string
  unit: string
  quantity: number
  used_quantity: number
}

interface InventorySection {
  id: string
  title: string
  items: InventoryItem[]
}

interface Project {
  id: string
  name: string
}

function statusBadge(item: InventoryItem) {
  const pct = item.quantity > 0 ? item.used_quantity / item.quantity : 0
  if (pct >= 1)   return { label: 'Depleted',    bg: '#E24B4A',    color: '#FFFFFF', borderColor: null }
  if (pct >= 0.8) return { label: 'Low',         bg: 'transparent', color: '#E24B4A', borderColor: '#E24B4A' }
  if (pct > 0)    return { label: 'On track',    bg: 'transparent', color: '#00236F', borderColor: '#00236F' }
  return              { label: 'Not started', bg: '#F5F6FA',    color: '#BBBBBB', borderColor: null }
}

function InventoryRow({ item, isLast }: { item: InventoryItem; isLast: boolean }) {
  const remaining = Math.max(0, item.quantity - item.used_quantity)
  const s = statusBadge(item)

  return (
    <div
      className={`grid gap-2 px-4 py-3 text-xs ${isLast ? '' : 'border-b'}`}
      style={{ borderColor: '#EEEEEE', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr' }}
    >
      <p className="font-medium truncate" style={{ color: '#111111' }}>{item.description}</p>
      <p style={{ color: '#666666' }}>{item.unit}</p>
      <p style={{ color: '#666666' }}>{item.quantity.toFixed(1)}</p>
      <p style={{ color: '#666666' }}>{item.used_quantity.toFixed(1)}</p>
      <p style={{ color: '#00236F', fontWeight: 500 }}>{remaining.toFixed(1)}</p>
      <span
        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
        style={{
          backgroundColor: s.bg,
          color: s.color,
          border: s.borderColor ? `1px solid ${s.borderColor}` : undefined,
        }}
      >
        {s.label}
      </span>
    </div>
  )
}

export default function InventoryPage() {
  const [project, setProject] = useState<Project | null>(null)
  const [sections, setSections] = useState<InventorySection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchInventory() {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: memberData, error: memberError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id)
        .limit(10)

      if (memberError || !memberData || memberData.length === 0) {
        setLoading(false)
        return
      }

      const projectIds = memberData.map((m: { project_id: string }) => m.project_id)

      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id, name')
        .in('id', projectIds)
        .eq('status', 'active')
        .limit(1)
        .single()

      if (projectError || !projectData) {
        setLoading(false)
        return
      }

      setProject(projectData as Project)

      const { data: sectionsData } = await supabase
        .from('boq_sections')
        .select('id, title')
        .eq('project_id', projectData.id)
        .order('order_index', { ascending: true })

      const rawSections = sectionsData ?? []

      if (rawSections.length > 0) {
        const sectionIds = rawSections.map((s: { id: string }) => s.id)

        const { data: itemsData } = await supabase
          .from('boq_items')
          .select('id, description, unit, quantity, used_quantity, section_id')
          .in('section_id', sectionIds)
          .order('description', { ascending: true })

        const itemsBySectionId: Record<string, InventoryItem[]> = {}
        for (const item of (itemsData ?? []) as (InventoryItem & { section_id: string })[]) {
          if (!itemsBySectionId[item.section_id]) itemsBySectionId[item.section_id] = []
          itemsBySectionId[item.section_id].push({
            id: item.id,
            description: item.description,
            unit: item.unit,
            quantity: item.quantity,
            used_quantity: item.used_quantity,
          })
        }

        const built: InventorySection[] = rawSections.map((s: { id: string; title: string }) => ({
          id: s.id,
          title: s.title,
          items: itemsBySectionId[s.id] ?? [],
        }))

        setSections(built)
      }

      setLoading(false)
    }

    fetchInventory()
  }, [])

  if (loading) {
    return (
      <div className="animate-pulse px-4 py-5 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 rounded-xl" style={{ backgroundColor: '#EEEEEE' }} />
        ))}
      </div>
    )
  }

  if (!project) {
    return (
      <div className="px-4 py-5 md:px-8 md:py-8" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div className="bg-white rounded-xl p-8 text-center" style={{ border: '0.5px solid #EEEEEE' }}>
          <p className="text-sm font-semibold mb-1" style={{ color: '#111111' }}>No active project</p>
          <p className="text-sm" style={{ color: '#666666' }}>You are not assigned to any active project.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-8" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h1 className="text-xl font-semibold mb-1" style={{ color: '#111111' }}>Inventory</h1>
      <p className="text-sm mb-5" style={{ color: '#666666' }}>{project.name}</p>

      {sections.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center" style={{ border: '0.5px solid #EEEEEE' }}>
          <p className="text-sm" style={{ color: '#BBBBBB' }}>No BOQ items found for this project.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: '0.5px solid #EEEEEE' }}>
          <div
            className="grid gap-2 px-4 py-2 border-b text-xs font-semibold uppercase tracking-wider"
            style={{ borderColor: '#EEEEEE', color: '#BBBBBB', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr' }}
          >
            <span>Item</span>
            <span>Unit</span>
            <span>Budget Qty</span>
            <span>Used Qty</span>
            <span>Remaining</span>
            <span>Status</span>
          </div>
          {sections.map((section) => (
            <div key={section.id}>
              <div className="px-4 py-2 border-b" style={{ borderColor: '#EEEEEE', backgroundColor: '#F5F6FA' }}>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#00236F' }}>
                  {section.title}
                </p>
              </div>
              {section.items.length === 0 ? (
                <div className="px-4 py-3 border-b" style={{ borderColor: '#EEEEEE' }}>
                  <p className="text-xs" style={{ color: '#BBBBBB' }}>No items in this section.</p>
                </div>
              ) : (
                section.items.map((item, idx) => (
                  <InventoryRow key={item.id} item={item} isLast={idx === section.items.length - 1} />
                ))
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
