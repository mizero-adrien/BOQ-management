'use client'

import { useState } from 'react'
import type { Project } from '@/types/database'
import { useProfile } from '@/hooks/useProfile'
import TeamMembersList from '@/components/pm/team/TeamMembersList'
import AddUserSearch from '@/components/pm/team/AddUserSearch'
import InviteForm from '@/components/pm/team/InviteForm'
import PendingInvitationsList from '@/components/pm/team/PendingInvitationsList'

interface Props {
  project: Project
}

export default function TeamTab({ project }: Props) {
  const [activeTab, setActiveTab] = useState<'add' | 'invite'>('add')
  const { profile } = useProfile()

  return (
    <div>
      <div className="flex gap-2 mb-5">
        {(['add', 'invite'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActiveTab(t)}
            className="px-4 py-1.5 rounded-full text-sm font-medium"
            style={activeTab === t
              ? { backgroundColor: '#00236F', color: '#FFFFFF' }
              : { backgroundColor: '#FFFFFF', color: '#666666', border: '1px solid #EEEEEE' }}
          >
            {t === 'add' ? 'Add existing user' : 'Invite by link'}
          </button>
        ))}
      </div>

      <TeamMembersList projects={[project]} loading={false} />

      {activeTab === 'add' ? (
        <AddUserSearch projectId={project.id} companyId={project.company_id} />
      ) : (
        <div>
          <InviteForm projects={[project]} defaultProjectId={project.id} />
          <PendingInvitationsList
            projectId={project.id}
            projectName={project.name}
            pmName={profile?.full_name ?? ''}
          />
        </div>
      )}
    </div>
  )
}
