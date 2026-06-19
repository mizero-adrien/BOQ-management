'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface DirectMessage {
  id: string
  project_id: string
  sender_id: string
  recipient_id: string
  body: string
  read_at: string | null
  created_at: string
  sender_name: string
}

export interface Conversation {
  partner_id: string
  partner_name: string
  partner_role: string
  last_message: string
  last_message_at: string
  unread_count: number
}

type ProfileEntry = { full_name: string; role: string }

export function useDirectMessages(projectId: string, partnerId: string, userId: string) {
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const cache = useRef<Map<string, ProfileEntry>>(new Map())

  const ensureProfile = useCallback(async (uid: string) => {
    if (cache.current.has(uid)) return
    const { data } = await supabase.from('profiles').select('id, full_name, role').eq('id', uid).single()
    if (data) cache.current.set(data.id, { full_name: data.full_name, role: data.role })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!projectId || !partnerId || !userId) return
    let active = true

    async function load() {
      const { data: rows } = await supabase
        .from('direct_messages')
        .select('id, project_id, sender_id, recipient_id, body, read_at, created_at')
        .eq('project_id', projectId)
        .or(
          `and(sender_id.eq.${userId},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${userId})`
        )
        .order('created_at', { ascending: true })

      if (!active || !rows) { setLoading(false); return }

      const ids = [...new Set([...rows.map((r) => r.sender_id), userId].filter(Boolean))]
      if (ids.length) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name, role').in('id', ids)
        profiles?.forEach((p) => cache.current.set(p.id, { full_name: p.full_name, role: p.role }))
      }

      if (active) {
        setMessages(rows.map((r) => ({ ...r, sender_name: cache.current.get(r.sender_id)?.full_name ?? 'Unknown' })))
        setLoading(false)
      }

      const unread = rows.filter((r) => r.recipient_id === userId && !r.read_at).map((r) => r.id)
      if (unread.length) {
        supabase.from('direct_messages').update({ read_at: new Date().toISOString() }).in('id', unread).then(() => {})
      }
    }

    load()

    const channel = supabase
      .channel(`dm:${projectId}:${userId}:${partnerId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages', filter: `project_id=eq.${projectId}` },
        async (payload) => {
          const row = payload.new as DirectMessage
          const involves =
            (row.sender_id === userId && row.recipient_id === partnerId) ||
            (row.sender_id === partnerId && row.recipient_id === userId)
          if (!involves) return
          await ensureProfile(row.sender_id)
          const enriched = { ...row, sender_name: cache.current.get(row.sender_id)?.full_name ?? 'Unknown' }
          // Deduplicate: send() already adds the message optimistically
          setMessages((prev) => prev.some((m) => m.id === enriched.id) ? prev : [...prev, enriched])
          if (row.recipient_id === userId) {
            supabase.from('direct_messages').update({ read_at: new Date().toISOString() }).eq('id', row.id).then(() => {})
          }
        }
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [projectId, partnerId, userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const send = useCallback(
    async (body: string) => {
      if (!body.trim()) return
      // Insert and get the row back so we can add it immediately without waiting for Realtime
      const { data: newMsg } = await supabase
        .from('direct_messages')
        .insert({ project_id: projectId, sender_id: userId, recipient_id: partnerId, body: body.trim() })
        .select('id, project_id, sender_id, recipient_id, body, read_at, created_at')
        .single()
      if (newMsg) {
        await ensureProfile(newMsg.sender_id)
        const enriched = { ...newMsg, sender_name: cache.current.get(newMsg.sender_id)?.full_name ?? 'Unknown' }
        setMessages((prev) => prev.some((m) => m.id === enriched.id) ? prev : [...prev, enriched])
      }
    },
    [projectId, partnerId, userId, ensureProfile] // eslint-disable-line react-hooks/exhaustive-deps
  )

  return { messages, loading, send }
}

export function useConversations(projectId: string, userId: string) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!projectId || !userId) return
    let active = true

    async function load() {
      const { data: rows } = await supabase
        .from('direct_messages')
        .select('sender_id, recipient_id, body, read_at, created_at')
        .eq('project_id', projectId)
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: false })

      if (!active || !rows) { setLoading(false); return }

      const partnerMap = new Map<string, { last_message: string; last_message_at: string; unread_count: number }>()
      for (const r of rows) {
        const pid = r.sender_id === userId ? r.recipient_id : r.sender_id
        if (!partnerMap.has(pid)) {
          partnerMap.set(pid, { last_message: r.body, last_message_at: r.created_at, unread_count: 0 })
        }
        if (r.recipient_id === userId && !r.read_at) {
          const cur = partnerMap.get(pid)!
          partnerMap.set(pid, { ...cur, unread_count: cur.unread_count + 1 })
        }
      }

      if (partnerMap.size === 0) { if (active) { setConversations([]); setLoading(false) } return }

      const pids = [...partnerMap.keys()]
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, role').in('id', pids)

      const convs: Conversation[] = pids
        .map((pid) => {
          const p = profiles?.find((x) => x.id === pid)
          const info = partnerMap.get(pid)!
          return { partner_id: pid, partner_name: p?.full_name ?? 'Unknown', partner_role: p?.role ?? '', ...info }
        })
        .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())

      if (active) { setConversations(convs); setLoading(false) }
    }

    load()

    const channel = supabase
      .channel(`convs:${projectId}:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages', filter: `project_id=eq.${projectId}` },
        (payload) => {
          const r = payload.new as { sender_id: string; recipient_id: string }
          if (r.sender_id === userId || r.recipient_id === userId) load()
        }
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [projectId, userId]) // eslint-disable-line react-hooks/exhaustive-deps

  return { conversations, loading }
}
