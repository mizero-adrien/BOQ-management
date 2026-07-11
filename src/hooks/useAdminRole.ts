'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type AdminLevel = 'super_admin' | 'admin' | null

export function useAdminRole() {
  const [adminLevel, setAdminLevel] = useState<AdminLevel>(null)
  const [adminId, setAdminId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function check() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      setAdminId(user.id)
      const role = user.user_metadata?.role as string
      if (role === 'super_admin') setAdminLevel('super_admin')
      else if (role === 'admin') setAdminLevel('admin')
      setLoading(false)
    }
    check()
  }, [])

  const isSuperAdmin = adminLevel === 'super_admin'
  const isAdmin = adminLevel === 'super_admin' || adminLevel === 'admin'

  return { adminLevel, adminId, isSuperAdmin, isAdmin, loading }
}
