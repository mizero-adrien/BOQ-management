'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { BOQSection, BOQItem } from '@/types/database'
import { toast } from '@/lib/toast'

export interface BOQItemWithComputed extends BOQItem {
  usage_pct: number
}

export interface BOQSectionWithItems extends BOQSection {
  items: BOQItemWithComputed[]
  total_budgeted: number
  total_used: number
  usage_pct: number
}

// Backward compat alias — existing components import PMBOQSection
export type PMBOQSection = BOQSectionWithItems

export interface BOQSummary {
  total_budgeted: number
  total_used: number
  total_remaining: number
  usage_pct: number
}

export interface NewBOQItem {
  description: string
  unit: string
  quantity: number
  unit_rate: number
  order_index?: number
}

export type BOQItemUpdate = {
  description?: string
  unit?: string
  quantity?: number
  unit_rate?: number
}

export function usePMBOQ(projectId: string | null | undefined) {
  const [sections, setSections] = useState<BOQSectionWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBOQ = useCallback(async () => {
    if (!projectId) {
      setSections([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('boq_sections')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true })

      if (sectionsError) {
        setError(sectionsError.message)
        return
      }
      if (!sectionsData || sectionsData.length === 0) {
        setSections([])
        return
      }

      const built: BOQSectionWithItems[] = []
      for (const section of sectionsData) {
        const { data: itemsData } = await supabase
          .from('boq_items')
          .select('*')
          .eq('section_id', section.id)
          .order('order_index', { ascending: true })

        const items: BOQItemWithComputed[] = (itemsData ?? []).map((item) => ({
          ...item,
          usage_pct: item.budgeted_total > 0
            ? Math.round((item.used_total / item.budgeted_total) * 1000) / 10
            : 0,
        }))
        const total_budgeted = items.reduce((s, i) => s + (i.budgeted_total ?? 0), 0)
        const total_used = items.reduce((s, i) => s + (i.used_total ?? 0), 0)
        const usage_pct = total_budgeted > 0 ? Math.round((total_used / total_budgeted) * 1000) / 10 : 0
        built.push({ ...section, items, total_budgeted, total_used, usage_pct })
      }
      setSections(built)
    } catch (err) {
      console.error('usePMBOQ:', err)
      setError('Failed to load BOQ data')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { fetchBOQ() }, [fetchBOQ])

  const totalBudgeted = sections.reduce((s, sec) => s + sec.total_budgeted, 0)
  const totalUsed = sections.reduce((s, sec) => s + sec.total_used, 0)

  const summary: BOQSummary = {
    total_budgeted: totalBudgeted,
    total_used: totalUsed,
    total_remaining: totalBudgeted - totalUsed,
    usage_pct: totalBudgeted > 0 ? Math.round((totalUsed / totalBudgeted) * 1000) / 10 : 0,
  }

  async function addSection(title: string, pid: string): Promise<string | null> {
    const supabase = createClient()
    const maxOrder = sections.length > 0 ? Math.max(...sections.map((s) => s.order_index)) : 0
    const { data, error: err } = await supabase
      .from('boq_sections')
      .insert({ project_id: pid, title, order_index: maxOrder + 1, status: 'not_started' })
      .select('*').single()
    if (err) { console.error('addSection:', err.message); return null }
    setSections((prev) => [...prev, { ...data, items: [], total_budgeted: 0, total_used: 0, usage_pct: 0 }])
    return data.id
  }

  async function bulkAddItems(sectionId: string, items: NewBOQItem[]): Promise<void> {
    const supabase = createClient()
    const { error: err } = await supabase.from('boq_items').insert(
      items.map((item) => ({ section_id: sectionId, ...item, used_quantity: 0, used_total: 0, status: 'not_started' }))
    )
    if (err) { console.error('bulkAddItems:', err.message); return }
    await fetchBOQ()
  }

  async function updateSection(sectionId: string, title: string) {
    const supabase = createClient()
    const { error: err } = await supabase.from('boq_sections').update({ title }).eq('id', sectionId)
    if (err) { console.error('updateSection:', err.message); toast.error('Could not rename section', err.message); return }
    setSections((prev) => prev.map((s) => s.id === sectionId ? { ...s, title } : s))
    toast.success('Section renamed', title)
  }

  async function deleteSection(sectionId: string) {
    const supabase = createClient()
    const { error: err } = await supabase.from('boq_sections').delete().eq('id', sectionId)
    if (err) { console.error('deleteSection:', err.message); toast.error('Could not delete section', err.message); return }
    setSections((prev) => prev.filter((s) => s.id !== sectionId))
    toast.success('Section deleted')
  }

  async function addItem(sectionId: string, item: NewBOQItem) {
    const supabase = createClient()
    const section = sections.find((s) => s.id === sectionId)
    const maxOrder = section ? Math.max(0, ...section.items.map((i) => i.order_index)) : 0
    const { data, error: err } = await supabase
      .from('boq_items')
      .insert({ section_id: sectionId, description: item.description, unit: item.unit, quantity: item.quantity, unit_rate: item.unit_rate, order_index: maxOrder + 1, used_quantity: 0, used_total: 0, status: 'not_started' })
      .select('*').single()
    if (err) { console.error('addItem:', err.message); toast.error('Could not add item', err.message); return }
    const newItem: BOQItemWithComputed = { ...data, usage_pct: 0 }
    setSections((prev) => prev.map((s) => {
      if (s.id !== sectionId) return s
      const newItems = [...s.items, newItem]
      const tb = newItems.reduce((sum, i) => sum + (i.budgeted_total ?? 0), 0)
      const tu = newItems.reduce((sum, i) => sum + (i.used_total ?? 0), 0)
      return { ...s, items: newItems, total_budgeted: tb, total_used: tu, usage_pct: tb > 0 ? (tu / tb) * 100 : 0 }
    }))
    toast.success('Item added', item.description)
  }

  async function updateItem(itemId: string, updates: BOQItemUpdate) {
    const supabase = createClient()
    const { error: err } = await supabase.from('boq_items').update(updates).eq('id', itemId)
    if (err) { console.error('updateItem:', err.message); toast.error('Could not save item', err.message); return }
    await fetchBOQ()
    toast.success('Item saved')
  }

  async function deleteItem(itemId: string) {
    const supabase = createClient()
    const { error: err } = await supabase.from('boq_items').delete().eq('id', itemId)
    if (err) { console.error('deleteItem:', err.message); toast.error('Could not delete item', err.message); return }
    setSections((prev) => prev.map((s) => {
      const newItems = s.items.filter((i) => i.id !== itemId)
      if (newItems.length === s.items.length) return s
      const tb = newItems.reduce((sum, i) => sum + (i.budgeted_total ?? 0), 0)
      const tu = newItems.reduce((sum, i) => sum + (i.used_total ?? 0), 0)
      return { ...s, items: newItems, total_budgeted: tb, total_used: tu, usage_pct: tb > 0 ? (tu / tb) * 100 : 0 }
    }))
    toast.success('Item deleted')
  }

  async function reorderSections(reordered: BOQSectionWithItems[]) {
    setSections(reordered)
    const supabase = createClient()
    await Promise.all(reordered.map((s, idx) =>
      supabase.from('boq_sections').update({ order_index: idx + 1 }).eq('id', s.id)
    ))
  }

  return {
    sections, loading, error, summary,
    totalBudget: totalBudgeted, totalUsed, totalRemaining: totalBudgeted - totalUsed, usagePct: summary.usage_pct,
    addSection, bulkAddItems, updateSection, deleteSection, reorderSections,
    addItem, updateItem, deleteItem, refetch: fetchBOQ,
  }
}
