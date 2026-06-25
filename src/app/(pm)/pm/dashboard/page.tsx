'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePMProjects } from '@/hooks/usePMProjects'
import { useTodayReports } from '@/hooks/useTodayReports'
import { usePMStats } from '@/hooks/usePMStats'
import { formatDate } from '@/lib/utils'
import StatCard from '@/components/pm/StatCard'
import ProjectCard from '@/components/pm/ProjectCard'
import ReportRow from '@/components/pm/ReportRow'
import IssueItem from '@/components/pm/IssueItem'
import MobileProfileCard from '@/components/pm/MobileProfileCard'
import { EmptyCard, InfoIcon, XSmallIcon } from '@/components/shared/DashboardUtils'
import { SkeletonStats, SkeletonCard, SkeletonTable } from '@/components/shared/Skeleton'
import ProcurementWidget from '@/components/pm/ProcurementWidget'
import AppHeader from '@/components/shared/AppHeader'

const PlusIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const PersonPlusIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" y1="8" x2="19" y2="14" />
    <line x1="22" y1="11" x2="16" y2="11" />
  </svg>
)

export default function PMDashboardPage() {
  const { projects, loading: projectsLoading } = usePMProjects()
  const { reports, totalEngineers, loading: reportsLoading } = useTodayReports(projects)
  const stats = usePMStats(projects, reports, totalEngineers)
  const [searchQuery, setSearchQuery] = useState('')
  const [demoBannerDismissed, setDemoBannerDismissed] = useState(false)
  const router = useRouter()

  const hasDemo = projects.some((p) => p.is_demo === true)
  const isLoading = projectsLoading || reportsLoading
  const today = formatDate(new Date().toISOString())
  const q = searchQuery.trim().toLowerCase()

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.location.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const filteredReports = q
    ? reports.filter((r) => r.projectName.toLowerCase().includes(q) || r.engineerName.toLowerCase().includes(q))
    : reports
  const issueReports = filteredReports.filter((r) => r.issues !== null && r.issues.trim() !== '')

  return (
    <>
      <AppHeader
        title="Dashboard"
        subtitle={today}
        searchPlaceholder="Search projects or engineers..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        messagesHref="/pm/messages"
        notificationsHref="/pm/notifications"
        profileHref="/pm/profile"
        settingsHref="/pm/settings"
      />

      <div className="px-4 py-5 md:px-8 md:py-8" style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Action buttons row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '20px', gap: '8px' }}>
          <button
            type="button"
            onClick={() => router.push('/pm/projects/new')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', backgroundColor: '#1565D8', color: '#FFFFFF',
              border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            }}>
            {PlusIcon}
            New project
          </button>
          <button
            type="button"
            onClick={() => router.push('/pm/team')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', backgroundColor: '#FFFFFF', color: '#1A2332',
              border: '1px solid #DDE3E8', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
            }}>
            {PersonPlusIcon}
            Invite team
          </button>
        </div>
        {hasDemo && !demoBannerDismissed && (
          <div
            className="flex items-start gap-3 rounded-xl px-4 py-3 mb-5"
            style={{ backgroundColor: '#E4E9FA', border: '1px solid #C8D4F8' }}
          >
            <InfoIcon />
            <p className="flex-1 text-sm" style={{ color: '#00236F', lineHeight: '1.5' }}>
              You are viewing demo data from a real Musanze construction project. Create your own project to get started.
            </p>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => router.push('/pm/projects')}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ border: '1px solid #00236F', color: '#00236F' }}
              >
                Create real project
              </button>
              <button
                type="button"
                onClick={() => setDemoBannerDismissed(true)}
                aria-label="Dismiss"
                style={{ color: '#BBBBBB' }}
              >
                <XSmallIcon />
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        {isLoading ? (
          <div className="mb-8"><SkeletonStats count={4} /></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <StatCard label="Active projects" value={String(stats.activeProjects)} />
            <StatCard label="Reports today" value={`${stats.reportsToday.submitted}/${stats.reportsToday.total}`} alert={stats.reportsToday.submitted < stats.reportsToday.total} />
            <StatCard label="Workers on site" value={String(stats.totalWorkers)} />
            <StatCard label="Open issues" value={String(stats.openIssues)} alert={stats.openIssues > 0} />
          </div>
        )}

        <ProcurementWidget />

        {/* Projects */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold" style={{ color: '#111111' }}>Your projects</h2>
            <Link href="/pm/projects" className="text-sm" style={{ color: '#00236F' }}>View all</Link>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[0, 1].map((i) => <SkeletonCard key={i} height="200px" />)}
            </div>
          ) : filteredProjects.length === 0 ? (
            q ? (
              <p style={{ textAlign: 'center', fontSize: '13px', color: '#8FA3B3', padding: '32px 0' }}>
                No projects match your search
              </p>
            ) : (
              <EmptyCard message="No projects yet" />
            )
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredProjects.slice(0, 4).map((project) => <ProjectCard key={project.id} project={project} />)}
            </div>
          )}
        </div>

        {/* Reports + Issues */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-base font-semibold mb-3" style={{ color: '#111111' }}>Reports today</h2>
            {isLoading ? <SkeletonTable rows={3} /> : filteredReports.length === 0 ? (
              <EmptyCard message={q ? 'No reports match your search' : 'No reports submitted yet today'} />
            ) : (
              filteredReports.map((report) => <ReportRow key={report.id} report={report} />)
            )}
          </div>
          <div>
            <h2 className="text-base font-semibold mb-3" style={{ color: '#111111' }}>Issues flagged today</h2>
            {isLoading ? <SkeletonTable rows={3} /> : issueReports.length === 0 ? (
              <EmptyCard message={q ? 'No issues match your search' : 'No issues reported today'} />
            ) : (
              issueReports.map((report) => <IssueItem key={report.id} report={report} />)
            )}
          </div>
        </div>

        <MobileProfileCard />
      </div>
    </>
  )
}
