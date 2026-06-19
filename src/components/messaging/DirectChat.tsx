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
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '16px',
        }}
      >
        {loading && (
          <p style={{ textAlign: 'center', color: '#BBBBBB', fontSize: '14px', paddingTop: '40px' }}>Loading...</p>
        )}
        {!loading && messages.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: '60px' }}>
            <p style={{ color: '#BBBBBB', fontSize: '14px' }}>No messages yet.</p>
            <p style={{ color: '#BBBBBB', fontSize: '13px', marginTop: '4px' }}>Send a message to {partnerName}.</p>
          </div>
        )}
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

      <MessageInput onSend={send} placeholder={`Message ${partnerName}...`} />
    </div>
  )
}
