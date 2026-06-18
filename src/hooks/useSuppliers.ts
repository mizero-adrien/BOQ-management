'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'

export interface Supplier {
  id: string
  company_id: string
  name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  category: string | null
  notes: string | null
  is_active: boolean
  created_by: string
  created_at: string
}

export interface CreateSupplierParams {
  name: string
  contact_name?: string
  email?: string
  phone?: string
  address?: string
  category?: string
  notes?: string
}

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSuppliers = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: member } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', user.id)
      .single()

    if (!member) { setLoading(false); return }

    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('company_id', member.company_id)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('useSuppliers:', error.message)
    } else {
      setSuppliers((data ?? []) as Supplier[])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchSuppliers() }, [fetchSuppliers])

  async function createSupplier(params: CreateSupplierParams): Promise<boolean> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data: member } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', user.id)
      .single()

    if (!member) return false

    const { error } = await supabase.from('suppliers').insert({
      ...params,
      company_id: (member as { company_id: string }).company_id,
      created_by: user.id,
    })

    if (error) { toast.error('Could not add supplier', error.message); return false }
    toast.success('Supplier added')
    await fetchSuppliers()
    return true
  }

  async function updateSupplier(id: string, params: Partial<CreateSupplierParams>): Promise<boolean> {
    const supabase = createClient()
    const { error } = await supabase.from('suppliers').update(params).eq('id', id)
    if (error) { toast.error('Could not update supplier', error.message); return false }
    toast.success('Supplier updated')
    await fetchSuppliers()
    return true
  }

  async function deactivateSupplier(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from('suppliers').update({ is_active: false }).eq('id', id)
    if (error) { toast.error('Could not remove supplier', error.message); return }
    toast.success('Supplier removed')
    await fetchSuppliers()
  }

  return { suppliers, loading, createSupplier, updateSupplier, deactivateSupplier, refetch: fetchSuppliers }
}
