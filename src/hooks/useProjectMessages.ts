'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface ProjectMessage {
  id: string
  project_id: string
  sender_id: string
  body: string
  created_at: string
  sender_name: string
  sender_role: string
}

type ProfileEntry = { full_name: string; role: string }

export function useProjectMessages(projectId: string) {
  const [messages, setMessages] = useState<ProjectMessage[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const cache = useRef<Map<string, ProfileEntry>>(new Map())

  const hydrate = useCallback(
    (row: { id: string; project_id: string; sender_id: string; body: string; created_at: string }): ProjectMessage => {
      const p = cache.current.get(row.sender_id)
      return { ...row, sender_name: p?.full_name ?? 'Unknown', sender_role: p?.role ?? '' }
    },
    []
  )

  useEffect(() => {
    if (!projectId) return
    let active = true

    async function load() {
      const { data: rows } = await supabase
        .from('project_messages')
        .select('id, project_id, sender_id, body, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })

      if (!active || !rows) { setLoading(false); return }

      const ids = [...new Set(rows.map((r) => r.sender_id))]
      if (ids.length) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name, role').in('id', ids)
        profiles?.forEach((p) => cache.current.set(p.id, { full_name: p.full_name, role: p.role }))
      }
      if (active) { setMessages(rows.map(hydrate)); setLoading(false) }
    }

    load()

    const channel = supabase
      .channel(`pm:${projectId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'project_messages', filter: `project_id=eq.${projectId}` },
        async (payload) => {
          const row = payload.new as { id: string; project_id: string; sender_id: string; body: string; created_at: string }
          if (!cache.current.has(row.sender_id)) {
            const { data } = await supabase.from('profiles').select('id, full_name, role').eq('id', row.sender_id).single()
            if (data) cache.current.set(data.id, { full_name: data.full_name, role: data.role })
          }
          setMessages((prev) => [...prev, hydrate(row)])
        }
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  const send = useCallback(
    async (body: string) => {
      if (!body.trim() || !projectId) return
      await supabase.from('project_messages').insert({ project_id: projectId, body: body.trim() })
    },
    [projectId] // eslint-disable-line react-hooks/exhaustive-deps
  )

  return { messages, loading, send }
}
