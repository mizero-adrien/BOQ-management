'use client'

import { useState } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { usePMProjects } from '@/hooks/usePMProjects'
import InviteByLinkTab from '@/components/pm/team/InviteByLinkTab'
import AddExistingUserTab from '@/components/pm/team/AddExistingUserTab'
import TeamMembersList from '@/components/pm/team/TeamMembersList'
import { SkeletonTable } from '@/components/shared/Skeleton'

type TabId = 'add' | 'invite'

export default function TeamPage() {
  const [activeTab, setActiveTab] = useState<TabId>('add')
  const { profile } = useProfile()
  const { projects, loading: projectsLoading } = usePMProjects()

  return (
    <div style={{ backgroundColor: '#F5F6FA', minHeight: '100vh', padding: '32px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111111', marginBottom: '4px' }}>
            Team
          </h1>
          <p style={{ fontSize: '14px', color: '#666666' }}>
            Manage project members
          </p>
        </div>

        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            border: '0.5px solid #EEEEEE',
            marginBottom: '20px',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', borderBottom: '0.5px solid #EEEEEE' }}>
            <button
              type="button"
              onClick={() => setActiveTab('add')}
              style={{
                flex: 1,
                padding: '14px 20px',
                fontSize: '14px',
                fontWeight: activeTab === 'add' ? '600' : '400',
                color: activeTab === 'add' ? '#00236F' : '#666666',
                backgroundColor: activeTab === 'add' ? '#E4E9FA' : '#fff',
                border: 'none',
                borderBottom: activeTab === 'add' ? '2px solid #00236F' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              Add existing user
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('invite')}
              style={{
                flex: 1,
                padding: '14px 20px',
                fontSize: '14px',
                fontWeight: activeTab === 'invite' ? '600' : '400',
                color: activeTab === 'invite' ? '#00236F' : '#666666',
                backgroundColor: activeTab === 'invite' ? '#E4E9FA' : '#fff',
                border: 'none',
                borderBottom: activeTab === 'invite' ? '2px solid #00236F' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              Invite by link
            </button>
          </div>

          <div style={{ padding: '20px' }}>
            {activeTab === 'add' && (
              <AddExistingUserTab
                projects={projects}
                currentUserId={profile?.id ?? ''}
              />
            )}
            {activeTab === 'invite' && (
              <InviteByLinkTab
                projects={projects}
                currentUserId={profile?.id ?? ''}
                currentUserName={profile?.full_name ?? 'Project Manager'}
              />
            )}
          </div>
        </div>

        <TeamMembersList projects={projects} loading={projectsLoading} />
      </div>
    </div>
  )
}
