'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'

export function useSignOut() {
  const router = useRouter()

  async function signOut() {
    toast.info('Signing out...')
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return { signOut }
}
