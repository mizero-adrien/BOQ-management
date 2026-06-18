'use client'

import { useEffect, useState } from 'react'
import { toast as toastManager, type Toast } from '@/lib/toast'

const BORDER: Record<string, string> = {
  success: '#5DCAA5',
  error: '#E24B4A',
  warning: '#EF9F27',
  info: '#778EDE',
}

const BG: Record<string, string> = {
  success: '#00236F',
  error: '#1A0A0A',
  warning: '#1A1200',
  info: '#0A0F1A',
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5DCAA5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function ErrorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF9F27" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#778EDE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

const ICONS: Record<string, React.ReactNode> = {
  success: <CheckIcon />,
  error: <ErrorIcon />,
  warning: <WarningIcon />,
  info: <InfoIcon />,
}

function ToastItem({ t, onDismiss }: { t: Toast; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(id)
  }, [])

  function handleDismiss() {
    setLeaving(true)
    setTimeout(onDismiss, 280)
  }

  return (
    <div
      onClick={handleDismiss}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        backgroundColor: BG[t.type],
        borderRadius: '10px',
        borderLeft: `3px solid ${BORDER[t.type]}`,
        padding: '12px 14px',
        marginBottom: '8px',
        cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        minWidth: '280px',
        maxWidth: '360px',
        transform: visible && !leaving ? 'translateX(0) scale(1)' : 'translateX(100%) scale(0.95)',
        opacity: visible && !leaving ? 1 : 0,
        transition: 'transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.28s ease',
      }}
    >
      <div style={{ flexShrink: 0, marginTop: '1px' }}>{ICONS[t.type]}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '13px', fontWeight: '600', color: '#FFFFFF', marginBottom: t.message ? '2px' : '0', lineHeight: '1.3' }}>
          {t.title}
        </p>
        {t.message && (
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.4', margin: 0 }}>
            {t.message}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); handleDismiss() }}
        style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center', opacity: 0.5 }}
        aria-label="Dismiss"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 768) }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    return toastManager.subscribe(setToasts)
  }, [])

  if (toasts.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: isMobile ? '80px' : '24px',
        right: isMobile ? '16px' : '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column-reverse',
      }}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} t={t} onDismiss={() => toastManager.dismiss(t.id)} />
      ))}
    </div>
  )
}
