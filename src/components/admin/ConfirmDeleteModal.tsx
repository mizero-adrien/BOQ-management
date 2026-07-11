'use client'

import { useState } from 'react'
import Spinner from '@/components/shared/Spinner'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  body: string
  confirmText: string
  confirmLabel?: string
  loading?: boolean
}

export default function ConfirmDeleteModal({
  isOpen, onClose, onConfirm, title, body, confirmText, confirmLabel = 'Delete permanently', loading = false,
}: Props) {
  const [input, setInput] = useState('')
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) setInput('')
  }

  if (!isOpen) return null

  const matches = input === confirmText
  const showError = input.length > 0 && !matches

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '28px', maxWidth: '400px', width: '90%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A2332', marginBottom: '8px' }}>{title}</h2>
        <p style={{ fontSize: '13px', color: '#5C7080', lineHeight: 1.6, marginBottom: '18px' }}>{body}</p>

        <label style={{ fontSize: '12px', color: '#5C7080', display: 'block', marginBottom: '6px' }}>
          Type <strong>{confirmText}</strong> to confirm
        </label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{
            width: '100%',
            padding: '9px 12px',
            fontSize: '13px',
            borderRadius: '8px',
            border: showError ? '1.5px solid #DC2626' : '1px solid #DDE3E8',
            marginBottom: showError ? '6px' : '18px',
            outline: 'none',
            color: '#1A2332',
          }}
          disabled={loading}
        />
        {showError && (
          <p style={{ fontSize: '12px', color: '#DC2626', marginBottom: '18px' }}>Text does not match</p>
        )}

        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #DDE3E8', backgroundColor: '#FFFFFF', color: '#1A2332', fontSize: '13px', fontWeight: 600, marginBottom: '8px', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={!matches || loading}
          style={{
            width: '100%', padding: '11px', borderRadius: '8px', border: 'none',
            backgroundColor: !matches || loading ? '#F4B4B3' : '#DC2626',
            color: '#FFFFFF', fontSize: '13px', fontWeight: 600,
            cursor: !matches || loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
        >
          {loading && <Spinner size={14} />}
          {confirmLabel}
        </button>
      </div>
    </div>
  )
}
