'use client'

import { useState, useRef, useCallback } from 'react'

interface Props {
  onSend: (body: string) => Promise<void>
  placeholder?: string
}

export default function MessageInput({ onSend, placeholder = 'Type a message...' }: Props) {
  const [value, setValue] = useState('')
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = useCallback(async () => {
    const trimmed = value.trim()
    if (!trimmed || sending) return
    setSending(true)
    await onSend(trimmed)
    setValue('')
    setSending(false)
    textareaRef.current?.focus()
  }, [value, sending, onSend])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const canSend = value.trim().length > 0 && !sending

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '8px',
        padding: '10px 14px',
        borderTop: '1px solid #EEEEEE',
        backgroundColor: '#FFFFFF',
        flexShrink: 0,
      }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        style={{
          flex: 1,
          resize: 'none',
          border: '1px solid #EEEEEE',
          borderRadius: '20px',
          padding: '8px 14px',
          fontSize: '14px',
          color: '#111111',
          backgroundColor: '#F5F6FA',
          outline: 'none',
          maxHeight: '96px',
          overflowY: 'auto',
          lineHeight: 1.4,
          fontFamily: 'inherit',
        }}
      />
      <button
        type="button"
        onClick={handleSend}
        disabled={!canSend}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: canSend ? '#00236F' : '#EEEEEE',
          border: 'none',
          cursor: canSend ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'background-color 0.15s',
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke={canSend ? '#FFFFFF' : '#BBBBBB'}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
  )
}
