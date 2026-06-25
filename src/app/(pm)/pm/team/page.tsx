'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { usePMProjects } from '@/hooks/usePMProjects'
import InviteByLinkTab from '@/components/pm/team/InviteByLinkTab'
import AddExistingUserTab from '@/components/pm/team/AddExistingUserTab'
import TeamMembersList from '@/components/pm/team/TeamMembersList'
import NoProjectsEmptyState from '@/components/pm/NoProjectsEmptyState'
import ProjectsFetchError from '@/components/pm/ProjectsFetchError'
import PMTopBar from '@/components/pm/PMTopBar'

type TabId = 'add' | 'invite'

export default function TeamPage() {
  const [activeTab, setActiveTab] = useState<TabId>('add')
  const { profile } = useProfile()
  const { projects, loading: projectsLoading, error: projectsError } = usePMProjects()

  if (!projectsLoading && projectsError) return <ProjectsFetchError />

  if (!projectsLoading && projects.length === 0) {
    return (
      <NoProjectsEmptyState
        pageTitle="Team"
        pageSubtitle="Manage project members"
        icon={
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00236F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        }
        body="Create a project first before adding team members."
      />
    )
  }

  function scrollToInvite() {
    const el = document.getElementById('team-invite-section')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const InviteIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  )

  return (
    <>
      <PMTopBar title="Team" />
      <div style={{ backgroundColor: '#F4F6F8', minHeight: '100vh', padding: '32px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Action row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={scrollToInvite}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', backgroundColor: '#FFFFFF', color: '#1A2332',
              border: '1px solid #DDE3E8', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
            }}>
            {InviteIcon}
            Invite team member
          </button>
        </div>

        <div id="team-invite-section">

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
    </div>
    </>
  )
}
