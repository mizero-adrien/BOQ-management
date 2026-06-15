'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getRedirectPath } from '@/lib/utils/getRedirectPath'

export default function RedirectPage() {
  const router = useRouter()

  useEffect(() => {
    async function go() {
      const supabase = createClient()
      // getSession reads from the local browser cache — no network call needed
      // here since we only need the role from metadata, not token validation
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error || !session) {
        router.replace('/login')
        return
      }

      const role = (session.user.user_metadata?.role as string) ?? ''
      const projectId = session.user.user_metadata?.project_id as string | undefined
      router.replace(getRedirectPath(role, projectId))
    }
    go()
  }, [router])

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#F5F6FA' }}
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-10 h-10 rounded-full animate-pulse"
          style={{ backgroundColor: '#E4E9FA' }}
        />
        <div
          className="h-2.5 w-20 rounded animate-pulse"
          style={{ backgroundColor: '#EEEEEE' }}
        />
      </div>
    </div>
  )
}
