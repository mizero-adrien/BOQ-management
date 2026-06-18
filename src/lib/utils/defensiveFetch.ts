'use client'

import { createClient } from '@/lib/supabase/client'

type SupabaseClient = ReturnType<typeof createClient>

export async function safeFetch<T>(
  queryFn: (supabase: SupabaseClient) => Promise<{ data: T[] | null; error: { message: string } | null }>,
  label: string
): Promise<T[]> {
  try {
    const supabase = createClient()
    const { data, error } = await queryFn(supabase)
    if (error) {
      console.error(`[${label}] fetch error:`, error.message)
      return []
    }
    return data ?? []
  } catch (err) {
    console.error(`[${label}] unexpected error:`, err)
    return []
  }
}
