'use client'

import { useState } from 'react'
import InviteSharePanel from '@/components/shared/InviteSharePanel'
import { generateInviteMessage } from '@/lib/utils/inviteMessage'
import type { PendingInvitation } from '@/hooks/usePendingInvitations'

const ROLE_LABEL: Record<string, string> = {
  engineer: 'Site Engineer', pm: 'Project Manager', foreman: 'Foreman',
  qs: 'Quantity Surveyor', storekeeper: 'Storekeeper',
}

function expiryLabel(expiresAt: string): { text: string; isExpired: boolean } {
  const now = new Date()
  const expires = new Date(expiresAt)
  const daysLeft = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (daysLeft < 0) return { text: 'Expired', isExpired: true }
  if (daysLeft === 0) return { text: 'Expires today', isExpired: false }
  if (daysLeft === 1) return { text: 'Expires tomorrow', isExpired: false }
  return { text: `Expires in ${daysLeft} days`, isExpired: false }
}

interface Props {
  inv: PendingInvitation
  projectName: string
  pmName: string
  getInviteLink: (token: string) => string
  onCancel: (id: string) => void
}

export default function PendingInvitationCard({ inv, projectName, pmName, getInviteLink, onCancel }: Props) {
  const [confirming, setConfirming] = useState(false)
  const link = getInviteLink(inv.token)
  const message = generateInviteMessage(null, projectName || 'your project', inv.role, pmName || 'Your project manager', link)
  const expiry = expiryLabel(inv.expires_at)

  return (
    <div className="bg-white rounded-xl mb-3 p-4" style={{ border: '1px solid #EEEEEE' }}>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <p className="text-sm font-medium flex-1 min-w-0 truncate" style={{ color: '#111111' }}>{inv.email}</p>
        <span className="text-xs rounded-full px-2.5 py-0.5 flex-shrink-0"
          style={{ backgroundColor: '#E4E9FA', color: '#00236F' }}>
          {ROLE_LABEL[inv.role] ?? inv.role}
        </span>
        <span className="text-xs flex-shrink-0" style={{ color: expiry.isExpired ? '#E24B4A' : '#BBBBBB' }}>
          {expiry.text}
        </span>
      </div>
      <InviteSharePanel link={link} message={message} />
      {confirming ? (
        <div className="flex items-center gap-2 mt-3">
          <p className="text-xs flex-1" style={{ color: '#666666' }}>Are you sure?</p>
          <button type="button" onClick={() => onCancel(inv.id)}
            className="text-xs font-medium px-2.5 py-1.5 rounded-lg"
            style={{ backgroundColor: '#E24B4A', color: '#FFFFFF' }}>
            Yes, cancel
          </button>
          <button type="button" onClick={() => setConfirming(false)}
            className="text-xs font-medium" style={{ color: '#666666' }}>
            No
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirming(true)}
          className="text-xs font-medium mt-3"
          style={{ color: '#E24B4A' }}>
          Cancel invite
        </button>
      )}
    </div>
  )
}
