'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'

export type PurchaseRequestStatus =
  | 'draft' | 'pending_approval' | 'approved' | 'rejected'
  | 'ordered' | 'partially_delivered' | 'delivered' | 'cancelled'

export interface PurchaseRequest {
  id: string
  project_id: string
  company_id: string
  requested_by: string
  approved_by: string | null
  status: PurchaseRequestStatus
  title: string
  description: string | null
  required_by_date: string | null
  rejection_reason: string | null
  total_estimated_cost: number | null
  total_actual_cost: number | null
  created_at: string
  updated_at: string
  submitted_at: string | null
  approved_at: string | null
  requester_name: string
  project_name: string
}

export interface PurchaseRequestItem {
  id: string
  request_id: string
  boq_item_id: string | null
  description: string
  unit: string
  quantity_requested: number
  estimated_unit_price: number | null
  actual_unit_price: number | null
  quantity_delivered: number
  notes: string | null
}

export interface NewRequestItem {
  description: string
  unit: string
  quantityRequested: number
  estimatedUnitPrice?: number
  boqItemId?: string
  notes?: string
}

export interface CreateRequestParams {
  projectId: string
  title: string
  description?: string
  requiredByDate?: string
  items: NewRequestItem[]
}

export function usePurchaseRequests(projectId?: string) {
  const [requests, setRequests] = useState<PurchaseRequest[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    let query = supabase
      .from('purchase_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (projectId) query = query.eq('project_id', projectId)

    const { data: rawRequests, error } = await query

    if (error) { console.error('usePurchaseRequests:', error.message); setLoading(false); return }

    const rows = (rawRequests ?? []) as (PurchaseRequest & { requested_by: string; approved_by: string | null })[]

    const userIds = [...new Set(rows.map((r) => r.requested_by).filter(Boolean))]
    const projectIds = [...new Set(rows.map((r) => r.project_id).filter(Boolean))]

    const [profilesRes, projectsRes] = await Promise.all([
      userIds.length > 0
        ? supabase.from('profiles').select('id, full_name').in('id', userIds)
        : Promise.resolve({ data: [], error: null }),
      projectIds.length > 0
        ? supabase.from('projects').select('id, name').in('id', projectIds)
        : Promise.resolve({ data: [], error: null }),
    ])

    type NameRow = { id: string; full_name?: string; name?: string }
    const nameMap = Object.fromEntries(((profilesRes.data ?? []) as NameRow[]).map((p) => [p.id, p.full_name ?? '']))
    const projMap = Object.fromEntries(((projectsRes.data ?? []) as NameRow[]).map((p) => [p.id, p.name ?? '']))

    setRequests(rows.map((r) => ({ ...r, requester_name: nameMap[r.requested_by] ?? 'Unknown', project_name: projMap[r.project_id] ?? 'Unknown' })))
    setLoading(false)
  }, [projectId])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  async function createRequest(params: CreateRequestParams): Promise<string | null> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: member } = await supabase.from('company_members').select('company_id').eq('user_id', user.id).single()
    if (!member) return null

    const totalEstimated = params.items.reduce((s, i) => s + (i.quantityRequested * (i.estimatedUnitPrice ?? 0)), 0)

    const { data: req, error: reqErr } = await supabase.from('purchase_requests').insert({
      project_id: params.projectId, company_id: (member as { company_id: string }).company_id,
      requested_by: user.id, title: params.title,
      description: params.description ?? null, required_by_date: params.requiredByDate ?? null,
      total_estimated_cost: totalEstimated > 0 ? totalEstimated : null,
    }).select('id').single()

    if (reqErr || !req) { toast.error('Could not create request', reqErr?.message ?? 'Unknown error'); return null }

    const itemRows = params.items.map((item) => ({
      request_id: (req as { id: string }).id, description: item.description, unit: item.unit,
      quantity_requested: item.quantityRequested, estimated_unit_price: item.estimatedUnitPrice ?? null,
      boq_item_id: item.boqItemId ?? null, notes: item.notes ?? null,
    }))

    await supabase.from('purchase_request_items').insert(itemRows)
    toast.success('Request saved as draft')
    await fetchRequests()
    return (req as { id: string }).id
  }

  async function submitForApproval(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from('purchase_requests')
      .update({ status: 'pending_approval', submitted_at: new Date().toISOString() }).eq('id', id)
    if (error) { toast.error('Could not submit', error.message); return }
    toast.success('Submitted for approval')
    await fetchRequests()
  }

  async function approveRequest(id: string): Promise<void> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('purchase_requests')
      .update({ status: 'approved', approved_by: user.id, approved_at: new Date().toISOString() }).eq('id', id)
    if (error) { toast.error('Could not approve', error.message); return }
    toast.success('Request approved')
    await fetchRequests()
  }

  async function rejectRequest(id: string, reason: string): Promise<void> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('purchase_requests')
      .update({ status: 'rejected', approved_by: user.id, rejection_reason: reason }).eq('id', id)
    if (error) { toast.error('Could not reject', error.message); return }
    toast.success('Request rejected')
    await fetchRequests()
  }

  async function cancelRequest(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from('purchase_requests').update({ status: 'cancelled' }).eq('id', id)
    if (error) { toast.error('Could not cancel', error.message); return }
    toast.success('Request cancelled')
    await fetchRequests()
  }

  return { requests, loading, createRequest, submitForApproval, approveRequest, rejectRequest, cancelRequest, refetch: fetchRequests }
}
