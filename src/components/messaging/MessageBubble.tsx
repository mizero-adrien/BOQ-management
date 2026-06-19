'use client'

import { formatRole } from '@/lib/utils/roleLabels'

interface Props {
  body: string
  senderName: string
  senderRole: string
  createdAt: string
  isMine: boolean
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function MessageBubble({ body, senderName, senderRole, createdAt, isMine }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isMine ? 'row-reverse' : 'row',
        gap: '8px',
        alignItems: 'flex-end',
        maxWidth: '78%',
        alignSelf: isMine ? 'flex-end' : 'flex-start',
      }}
    >
      <div
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          backgroundColor: isMine ? '#00236F' : '#E4E9FA',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: '10px',
          fontWeight: 700,
          color: isMine ? '#FFFFFF' : '#00236F',
        }}
      >
        {initials(senderName)}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {!isMine && (
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#111111' }}>{senderName}</span>
          )}
          {!isMine && senderRole && (
            <span style={{ fontSize: '10px', color: '#778EDE', fontWeight: 500 }}>{formatRole(senderRole)}</span>
          )}
          <span style={{ fontSize: '11px', color: '#BBBBBB' }}>{formatTime(createdAt)}</span>
        </div>

        <div
          style={{
            backgroundColor: isMine ? '#00236F' : '#FFFFFF',
            color: isMine ? '#FFFFFF' : '#111111',
            borderRadius: isMine ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
            padding: '8px 12px',
            fontSize: '14px',
            lineHeight: 1.45,
            border: isMine ? 'none' : '1px solid #EEEEEE',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
          }}
        >
          {body}
        </div>
      </div>
    </div>
  )
}
