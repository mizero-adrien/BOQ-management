'use client'

export const dynamic = 'force-dynamic'

import { useActiveProject } from '@/hooks/useActiveProject'
import { useProfile } from '@/hooks/useProfile'
import MessagesPage from '@/components/messaging/MessagesPage'

export default function Page() {
  const { project } = useActiveProject()
  const { profile } = useProfile()

  if (!project || !profile) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: '#BBBBBB', fontSize: '14px' }}>
        Loading...
      </div>
    )
  }

  return <MessagesPage projectId={project.id} userId={profile.id} />
}
