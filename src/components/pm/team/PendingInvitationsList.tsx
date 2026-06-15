'use client'

import { usePendingInvitations } from '@/hooks/usePendingInvitations'
import PendingInvitationCard from './PendingInvitationCard'

interface Props {
  projectId: string
  projectName: string
  pmName: string
}

export default function PendingInvitationsList({ projectId, projectName, pmName }: Props) {
  const { invitations, loading, cancelInvitation, getInviteLink } = usePendingInvitations(projectId)

  if (loading || invitations.length === 0) return null

  return (
    <div className="mt-8">
      <h2 className="font-semibold mb-3" style={{ color: '#111111', fontSize: '16px' }}>Pending invitations</h2>
      {invitations.map((inv) => (
        <PendingInvitationCard
          key={inv.id}
          inv={inv}
          projectName={projectName}
          pmName={pmName}
          getInviteLink={getInviteLink}
          onCancel={cancelInvitation}
        />
      ))}
    </div>
  )
}
