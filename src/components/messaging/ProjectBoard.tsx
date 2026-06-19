'use client'

import { useEffect, useRef } from 'react'
import { useProjectMessages } from '@/hooks/useProjectMessages'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'

interface Props {
  projectId: string
  userId: string
}

function EmptyState() {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', padding: '32px 24px', textAlign: 'center' }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#BBBBBB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      <div>
        <p style={{ fontSize: '16px', fontWeight: 600, color: '#111111', margin: '0 0 6px' }}>Start the conversation</p>
        <p style={{ fontSize: '13px', color: '#BBBBBB', margin: 0, lineHeight: 1.55 }}>
          Send a message to your entire project team. Everyone on this project can see and reply.
        </p>
      </div>
    </div>
  )
}

export default function ProjectBoard({ projectId, userId }: Props) {
  const { messages, loading, send } = useProjectMessages(projectId, userId)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {loading && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#BBBBBB', fontSize: '14px', margin: 0 }}>Loading messages...</p>
          </div>
        )}
        {!loading && messages.length === 0 && <EmptyState />}
        {!loading && messages.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                body={msg.body}
                senderName={msg.sender_name}
                senderRole={msg.sender_role}
                createdAt={msg.created_at}
                isMine={msg.sender_id === userId}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
      {/* Input always visible */}
      <MessageInput onSend={send} placeholder="Message the project team..." />
    </div>
  )
}
