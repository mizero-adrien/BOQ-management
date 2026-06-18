'use client'

import { useState } from 'react'
import { toast } from '@/lib/toast'

interface Props {
  inviteLink: string
  message: string
  projectName: string
  inviteeEmail: string
  role: string
  onCreateAnother: () => void
}

function formatRole(role: string): string {
  const map: Record<string, string> = {
    engineer: 'Site Engineer',
    pm: 'Project Manager',
    foreman: 'Foreman',
    qs: 'Quantity Surveyor',
    storekeeper: 'Storekeeper',
    owner: 'Owner / Client',
  }
  return map[role] ?? role
}

export default function InviteSuccessPanel({ inviteLink, message, projectName, inviteeEmail, role, onCreateAnother }: Props) {
  const [linkCopied, setLinkCopied] = useState(false)
  const [messageCopied, setMessageCopied] = useState(false)

  async function copyLink() {
    await navigator.clipboard.writeText(inviteLink)
    setLinkCopied(true)
    toast.info('Link copied to clipboard')
    setTimeout(() => setLinkCopied(false), 2000)
  }

  async function copyMessage() {
    await navigator.clipboard.writeText(message)
    setMessageCopied(true)
    toast.info('Message copied to clipboard')
    setTimeout(() => setMessageCopied(false), 2000)
  }

  function shareWhatsApp() {
    window.open('https://wa.me/?text=' + encodeURIComponent(message), '_blank')
  }

  function shareEmail() {
    window.location.href = 'mailto:?subject=' + encodeURIComponent('Project invitation') + '&body=' + encodeURIComponent(message)
  }

  return (
    <div style={{ maxWidth: '480px' }}>
      <div style={{ backgroundColor: '#E4E9FA', border: '1px solid #C8D4F8', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px' }}>
        <p style={{ fontSize: '13px', fontWeight: '600', color: '#00236F', marginBottom: '4px' }}>
          Invitation created for {projectName}
        </p>
        <p style={{ fontSize: '13px', color: '#666666' }}>
          {inviteeEmail} will join {projectName} as {formatRole(role)}
        </p>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <p style={{ fontSize: '10px', fontWeight: '600', color: '#BBBBBB', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Invite link</p>
        <div style={{ backgroundColor: '#F5F6FA', border: '1px solid #EEEEEE', borderRadius: '8px', padding: '10px 12px', fontSize: '11px', color: '#666666', fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: '8px' }}>
          {inviteLink}
        </div>
        <button
          type="button"
          onClick={copyLink}
          style={{ width: '100%', padding: '10px', backgroundColor: linkCopied ? '#E4E9FA' : '#FFFFFF', border: '1.5px solid #00236F', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#00236F', cursor: 'pointer' }}
        >
          {linkCopied ? 'Copied' : 'Copy link'}
        </button>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <p style={{ fontSize: '10px', fontWeight: '600', color: '#BBBBBB', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Ready to send message</p>
        <textarea
          readOnly
          value={message}
          rows={8}
          style={{ width: '100%', backgroundColor: '#F5F6FA', border: '1px solid #EEEEEE', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#111111', lineHeight: '1.6', resize: 'none', outline: 'none', fontFamily: 'inherit', marginBottom: '8px' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <button
          type="button"
          onClick={shareWhatsApp}
          style={{ flex: 1, padding: '10px', backgroundColor: '#25D366', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#FFFFFF', cursor: 'pointer' }}
        >
          WhatsApp
        </button>
        <button
          type="button"
          onClick={copyMessage}
          style={{ flex: 1, padding: '10px', backgroundColor: messageCopied ? '#E4E9FA' : '#FFFFFF', border: '1.5px solid #00236F', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#00236F', cursor: 'pointer' }}
        >
          {messageCopied ? 'Copied' : 'Copy message'}
        </button>
        <button
          type="button"
          onClick={shareEmail}
          style={{ flex: 1, padding: '10px', backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#666666', cursor: 'pointer' }}
        >
          Email
        </button>
      </div>

      <button
        type="button"
        onClick={onCreateAnother}
        style={{ width: '100%', padding: '10px', backgroundColor: 'transparent', border: 'none', fontSize: '13px', color: '#666666', cursor: 'pointer' }}
      >
        Create another invitation
      </button>
    </div>
  )
}
