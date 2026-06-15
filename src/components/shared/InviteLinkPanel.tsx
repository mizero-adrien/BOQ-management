'use client'

import { useState } from 'react'

interface InviteLinkPanelProps {
  link: string
  label?: string
  onClose?: () => void
}

export default function InviteLinkPanel({ link, label, onClose }: InviteLinkPanelProps) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: '#E4E9FA', border: '1px solid #C8D4F8' }}>
      {(label || onClose) && (
        <div className="flex items-start justify-between gap-2 mb-2">
          {label && (
            <p className="text-sm font-medium" style={{ color: '#00236F' }}>{label}</p>
          )}
          {onClose && (
            <button type="button" onClick={onClose} className="flex-shrink-0 ml-auto" style={{ color: '#666666' }}>
              <XIcon />
            </button>
          )}
        </div>
      )}
      <div
        className="rounded-lg px-3 py-2 font-mono text-xs break-all mb-2"
        style={{ backgroundColor: '#F5F6FA', border: '1px solid #EEEEEE', color: '#111111' }}
      >
        {link}
      </div>
      <button
        type="button"
        onClick={copy}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg"
        style={{ border: `1px solid ${copied ? '#22AA55' : '#00236F'}`, color: copied ? '#22AA55' : '#00236F' }}
      >
        {copied ? 'Copied' : 'Copy link'}
      </button>
    </div>
  )
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
