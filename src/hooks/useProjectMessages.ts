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

export function useProjectMessages(projectId: string, userId: string) {
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

  const ensureProfile = useCallback(async (uid: string) => {
    if (cache.current.has(uid)) return
    const { data } = await supabase.from('profiles').select('id, full_name, role').eq('id', uid).single()
    if (data) cache.current.set(data.id, { full_name: data.full_name, role: data.role })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

      // Pre-load current user's profile so own sent messages hydrate correctly
      const ids = [...new Set([...rows.map((r) => r.sender_id), userId].filter(Boolean))]
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
          await ensureProfile(row.sender_id)
          // Deduplicate: send() already adds the message optimistically
          setMessages((prev) => prev.some((m) => m.id === row.id) ? prev : [...prev, hydrate(row)])
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
      // Insert and get the row back so we can add it immediately without waiting for Realtime
      const { data: newMsg } = await supabase
        .from('project_messages')
        .insert({ project_id: projectId, body: body.trim() })
        .select('id, project_id, sender_id, body, created_at')
        .single()
      if (newMsg) {
        await ensureProfile(newMsg.sender_id)
        setMessages((prev) => prev.some((m) => m.id === newMsg.id) ? prev : [...prev, hydrate(newMsg)])
      }
    },
    [projectId, hydrate, ensureProfile] // eslint-disable-line react-hooks/exhaustive-deps
  )

  return { messages, loading, send }
}
