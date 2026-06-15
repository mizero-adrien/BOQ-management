'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface PendingInvitation {
  id: string
  email: string
  role: string
  token: string
  expires_at: string
  createdAt: string
}

export function usePendingInvitations(projectId: string) {
  const [invitations, setInvitations] = useState<PendingInvitation[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    const supabase = createClient()
    supabase
      .from('invitations')
      .select('id, email, role, token, expires_at, created_at')
      .eq('project_id', projectId)
      .eq('accepted', false)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setInvitations(
          (data ?? []).map((inv) => ({
            id: inv.id as string,
            email: inv.email as string,
            role: inv.role as string,
            token: inv.token as string,
            expires_at: inv.expires_at as string,
            createdAt: inv.created_at as string,
          }))
        )
        setLoading(false)
      })
  }, [projectId])

  async function cancelInvitation(id: string) {
    const supabase = createClient()
    await supabase.from('invitations').delete().eq('id', id)
    setInvitations((prev) => prev.filter((inv) => inv.id !== id))
  }

  function getInviteLink(token: string) {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
    return `${base}/invite/${token}`
  }

  return { invitations, loading, cancelInvitation, getInviteLink }
}
