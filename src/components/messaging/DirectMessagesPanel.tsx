'use client'

import { useState } from 'react'
import { useConversations, type Conversation } from '@/hooks/useDirectMessages'
import { formatRole } from '@/lib/utils/roleLabels'
import DirectChat from './DirectChat'

interface Props {
  projectId: string
  userId: string
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

function ConversationRow({ conv, selected, onClick }: { conv: Conversation; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 14px',
        width: '100%',
        textAlign: 'left',
        border: 'none',
        cursor: 'pointer',
        backgroundColor: selected ? '#E4E9FA' : 'transparent',
        borderBottom: '1px solid #EEEEEE',
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: '#E4E9FA',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#00236F' }}>{initials(conv.partner_name)}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#111111' }}>{conv.partner_name}</span>
          {conv.unread_count > 0 && (
            <span style={{ fontSize: '10px', backgroundColor: '#00236F', color: '#FFFFFF', borderRadius: '10px', padding: '1px 6px', fontWeight: 700 }}>
              {conv.unread_count}
            </span>
          )}
        </div>
        <p style={{ fontSize: '12px', color: '#666666', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 0 }}>
          {formatRole(conv.partner_role)} &middot; {conv.last_message.length > 30 ? conv.last_message.slice(0, 30) + '…' : conv.last_message}
        </p>
      </div>
    </button>
  )
}

export default function DirectMessagesPanel({ projectId, userId }: Props) {
  const { conversations, loading } = useConversations(projectId, userId)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = conversations.find((c) => c.partner_id === selectedId) ?? null

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
      {/* Conversation list: full-screen on mobile when no selection, sidebar on desktop */}
      <div
        className={selectedId ? 'hidden md:flex md:flex-col md:w-64 md:flex-shrink-0' : 'flex flex-col w-full md:w-64 md:flex-shrink-0'}
        style={{ borderRight: '1px solid #EEEEEE', backgroundColor: '#FFFFFF', overflowY: 'auto' }}
      >
        {loading && (
          <p style={{ padding: '24px 16px', textAlign: 'center', color: '#BBBBBB', fontSize: '13px' }}>Loading...</p>
        )}
        {!loading && conversations.length === 0 && (
          <p style={{ padding: '32px 16px', textAlign: 'center', color: '#BBBBBB', fontSize: '13px', lineHeight: 1.5 }}>
            No direct messages yet. Messages from teammates will appear here.
          </p>
        )}
        {conversations.map((conv) => (
          <ConversationRow
            key={conv.partner_id}
            conv={conv}
            selected={selectedId === conv.partner_id}
            onClick={() => setSelectedId(conv.partner_id)}
          />
        ))}
      </div>

      {/* Chat pane: hidden on mobile until conversation selected, always shown on desktop */}
      <div
        className={selectedId ? 'flex flex-col flex-1 min-h-0' : 'hidden md:flex md:flex-col md:flex-1 md:min-h-0'}
        style={{ backgroundColor: '#F5F6FA' }}
      >
        {selected ? (
          <DirectChat
            projectId={projectId}
            userId={userId}
            partnerId={selected.partner_id}
            partnerName={selected.partner_name}
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#BBBBBB', fontSize: '14px' }}>Select a conversation</p>
          </div>
        )}
      </div>
    </div>
  )
}
