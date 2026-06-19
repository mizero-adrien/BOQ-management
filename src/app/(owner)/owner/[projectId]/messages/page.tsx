'use client'

export const dynamic = 'force-dynamic'

import { useParams } from 'next/navigation'
import { useProfile } from '@/hooks/useProfile'
import MessagesPage from '@/components/messaging/MessagesPage'

export default function Page() {
  const params = useParams()
  const projectId = params?.projectId as string | undefined
  const { profile } = useProfile()

  if (!profile || !projectId) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: '#BBBBBB', fontSize: '14px' }}>
        Loading...
      </div>
    )
  }

  return <MessagesPage projectId={projectId} userId={profile.id} />
}
