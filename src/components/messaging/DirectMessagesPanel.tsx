'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Conversation } from '@/hooks/useDirectMessages'
import { formatRole } from '@/lib/utils/roleLabels'
import DirectChat from './DirectChat'

interface Props {
  projectId: string
  userId: string
  conversations: Conversation[]
}

interface Member { user_id: string; full_name: string; role: string }

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

function NoSelectionState() {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', padding: '32px 24px', textAlign: 'center' }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#BBBBBB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
      <div>
        <p style={{ fontSize: '16px', fontWeight: 600, color: '#111111', margin: '0 0 6px' }}>Select a team member</p>
        <p style={{ fontSize: '13px', color: '#BBBBBB', margin: 0, lineHeight: 1.55 }}>
          Choose someone from the list to start a private conversation.
        </p>
      </div>
    </div>
  )
}

export default function DirectMessagesPanel({ projectId, userId, conversations }: Props) {
  const [members, setMembers] = useState<Member[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<'list' | 'conversation'>('list')

  useEffect(() => {
    if (!projectId || !userId) return
    const supabase = createClient()

    supabase
      .from('project_members')
      .select('user_id')
      .eq('project_id', projectId)
      .neq('user_id', userId)
      .then(async ({ data: pm }) => {
        if (!pm?.length) return
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .in('id', pm.map((m) => m.user_id))
        if (profiles) {
          setMembers(
            profiles
              .map((p) => ({ user_id: p.id, full_name: p.full_name, role: p.role }))
              .sort((a, b) => a.full_name.localeCompare(b.full_name))
          )
        }
      })
  }, [projectId, userId])

  const selected = members.find((m) => m.user_id === selectedId) ?? null

  function selectMember(id: string) {
    setSelectedId(id)
    setMobileView('conversation')
  }

  const memberList = (
    <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', backgroundColor: '#FFFFFF', height: '100%' }}>
      <div style={{ padding: '12px 16px 8px', fontSize: '11px', fontWeight: 600, color: '#BBBBBB', textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>
        Team
      </div>
      {members.length === 0 && (
        <p style={{ padding: '20px 16px', fontSize: '13px', color: '#BBBBBB', textAlign: 'center', margin: 0 }}>Loading team...</p>
      )}
      {members.map((member) => {
        const conv = conversations.find((c) => c.partner_id === member.user_id)
        const isSelected = selectedId === member.user_id
        return (
          <button
            key={member.user_id}
            type="button"
            onClick={() => selectMember(member.user_id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
              width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
              backgroundColor: isSelected ? '#E4E9FA' : 'transparent',
              borderBottom: '1px solid #EEEEEE', flexShrink: 0,
            }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#E4E9FA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#00236F' }}>{initials(member.full_name)}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#111111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {member.full_name}
                </span>
                {conv && conv.unread_count > 0 && (
                  <span style={{ fontSize: '10px', backgroundColor: '#E24B4A', color: '#FFFFFF', borderRadius: '10px', padding: '1px 6px', fontWeight: 700, flexShrink: 0 }}>
                    {conv.unread_count}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '12px', color: '#666666', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {conv
                  ? (conv.last_message.length > 36 ? conv.last_message.slice(0, 36) + '...' : conv.last_message)
                  : formatRole(member.role)}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
      {/* Left panel: always show team list */}
      <div
        className={`${mobileView === 'list' ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-64 md:flex-shrink-0`}
        style={{ borderRight: '1px solid #EEEEEE', overflow: 'hidden' }}
      >
        {memberList}
      </div>

      {/* Right panel: conversation or empty state */}
      <div
        className={`${mobileView === 'conversation' ? 'flex' : 'hidden'} md:flex flex-col flex-1 min-h-0`}
        style={{ backgroundColor: '#F5F6FA' }}
      >
        {selected ? (
          <DirectChat
            projectId={projectId}
            userId={userId}
            partnerId={selected.user_id}
            partnerName={selected.full_name}
            onBack={() => setMobileView('list')}
          />
        ) : (
          <NoSelectionState />
        )}
      </div>
    </div>
  )
}
