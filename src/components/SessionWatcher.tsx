'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const PUBLIC_PATHS = [
  '/login', '/signup', '/forgot-password', '/reset-password',
  '/auth', '/invite', '/share',
]

export default function SessionWatcher() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        const isPublic = PUBLIC_PATHS.some((p) => pathname?.startsWith(p))
        if (!isPublic) {
          router.replace('/login')
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [router, pathname])

  return null
}
