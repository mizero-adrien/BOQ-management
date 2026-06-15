'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface UserSearchResult {
  id: string
  full_name: string
  role: string
  email: string
}

export function useUserSearch() {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<UserSearchResult[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    const timer = setTimeout(async () => {
      const supabase = createClient()
      const { data } = await supabase.rpc('search_users', { search_term: searchTerm.trim() })
      setResults((data as UserSearchResult[]) ?? [])
      setSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  return { searchTerm, setSearchTerm, results, searching }
}
