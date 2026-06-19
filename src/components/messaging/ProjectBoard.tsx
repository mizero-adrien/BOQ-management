'use client'

import { useEffect, useRef } from 'react'
import { useProjectMessages } from '@/hooks/useProjectMessages'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'

interface Props {
  projectId: string
  userId: string
}

export default function ProjectBoard({ projectId, userId }: Props) {
  const { messages, loading, send } = useProjectMessages(projectId)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
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
          <p style={{ textAlign: 'center', color: '#BBBBBB', fontSize: '14px', paddingTop: '40px' }}>
            Loading messages...
          </p>
        )}
        {!loading && messages.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: '60px' }}>
            <p style={{ color: '#BBBBBB', fontSize: '14px' }}>No messages yet.</p>
            <p style={{ color: '#BBBBBB', fontSize: '13px', marginTop: '4px' }}>Start the project conversation.</p>
          </div>
        )}
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
      <MessageInput onSend={send} placeholder="Message the project team..." />
    </div>
  )
}
