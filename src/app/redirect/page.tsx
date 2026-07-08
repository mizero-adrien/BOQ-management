'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const DASHBOARD: Record<string, string> = {
  pm: '/pm/dashboard',
  engineer: '/dashboard',
  foreman: '/foreman/dashboard',
  qs: '/qs/dashboard',
  storekeeper: '/storekeeper/dashboard',
  procurement: '/procurement/dashboard',
}

function RedirectContent() {
  const router = useRouter()

  useEffect(() => {
    async function go() {
      const supabase = createClient()

      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user ?? null
      if (!user) { router.replace('/login'); return }

      const hasCompany = user.user_metadata?.has_company as boolean | undefined
      if (!hasCompany) { router.replace('/onboarding'); return }

      const { data: projects, error: rpcError } = await supabase
        .rpc('get_user_projects', { p_user_id: user.id })

      if (rpcError) { router.replace('/login'); return }

      if (!projects || projects.length === 0) {
        router.replace('/no-project?reason=new_user')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('last_active_project_id')
        .eq('id', user.id)
        .single()

      const lastActiveId = profile?.last_active_project_id as string | null
      const target = lastActiveId
        ? projects.find((p: { project_id: string }) => p.project_id === lastActiveId)
        : null
      const active = target ?? projects[0]

      if (active.user_role === 'owner') {
        router.replace(`/owner/${active.project_id}`)
        return
      }

      router.replace(DASHBOARD[active.user_role] ?? '/dashboard')
    }
    go()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F4F6F8' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full animate-pulse" style={{ backgroundColor: '#E4E9FA' }} />
        <div className="h-2.5 w-20 rounded animate-pulse" style={{ backgroundColor: '#EEEEEE' }} />
      </div>
    </div>
  )
}

export default function RedirectPage() {
  return (
    <Suspense fallback={<div />}>
      <RedirectContent />
    </Suspense>
  )
}
