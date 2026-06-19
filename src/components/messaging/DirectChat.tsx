'use client'

import { useEffect, useRef } from 'react'
import { useDirectMessages } from '@/hooks/useDirectMessages'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'

interface Props {
  projectId: string
  userId: string
  partnerId: string
  partnerName: string
  onBack?: () => void
}

export default function DirectChat({ projectId, userId, partnerId, partnerName, onBack }: Props) {
  const { messages, loading, send } = useDirectMessages(projectId, partnerId, userId)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          borderBottom: '1px solid #EEEEEE',
          backgroundColor: '#FFFFFF',
          flexShrink: 0,
        }}
      >
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="md:hidden"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              color: '#00236F',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        )}
        <p style={{ fontSize: '14px', fontWeight: 600, color: '#111111', margin: 0 }}>{partnerName}</p>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {loading && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#BBBBBB', fontSize: '14px', margin: 0 }}>Loading...</p>
          </div>
        )}
        {!loading && messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px', padding: '32px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#111111', margin: 0 }}>No messages yet</p>
            <p style={{ fontSize: '13px', color: '#BBBBBB', margin: 0, lineHeight: 1.55 }}>
              Send {partnerName} a message to start the conversation.
            </p>
          </div>
        )}
        {!loading && messages.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                body={msg.body}
                senderName={msg.sender_name}
                senderRole=""
                createdAt={msg.created_at}
                isMine={msg.sender_id === userId}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <MessageInput onSend={send} placeholder={`Message ${partnerName}...`} />
    </div>
  )
}
