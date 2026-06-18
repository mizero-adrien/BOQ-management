'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePMProjects } from '@/hooks/usePMProjects'
import { useTodayReports } from '@/hooks/useTodayReports'
import { usePMStats } from '@/hooks/usePMStats'
import { useNotifications } from '@/hooks/useNotifications'
import { formatDate } from '@/lib/utils'
import StatCard from '@/components/pm/StatCard'
import ProjectCard from '@/components/pm/ProjectCard'
import ReportRow from '@/components/pm/ReportRow'
import IssueItem from '@/components/pm/IssueItem'
import NotificationBell from '@/components/shared/NotificationBell'
import MobileProfileCard from '@/components/pm/MobileProfileCard'
import { EmptyCard, SearchIcon, InfoIcon, XSmallIcon } from '@/components/shared/DashboardUtils'
import { SkeletonStats, SkeletonCard, SkeletonTable } from '@/components/shared/Skeleton'
import ProcurementWidget from '@/components/pm/ProcurementWidget'

export default function PMDashboardPage() {
  const { projects, loading: projectsLoading } = usePMProjects()
  const { reports, totalEngineers, loading: reportsLoading } = useTodayReports(projects)
  const stats = usePMStats(projects, reports, totalEngineers)
  const { unreadCount } = useNotifications()
  const [search, setSearch] = useState('')
  const [demoBannerDismissed, setDemoBannerDismissed] = useState(false)
  const router = useRouter()

  const hasDemo = projects.some((p) => p.is_demo === true)

  const isLoading = projectsLoading || reportsLoading
  const today = formatDate(new Date().toISOString())
  const q = search.trim().toLowerCase()

  const filteredProjects = q ? projects.filter((p) => p.name.toLowerCase().includes(q)) : projects
  const filteredReports = q
    ? reports.filter((r) => r.projectName.toLowerCase().includes(q) || r.engineerName.toLowerCase().includes(q))
    : reports
  const issueReports = filteredReports.filter((r) => r.issues !== null && r.issues.trim() !== '')

  return (
    <div className="px-4 py-5 md:px-8 md:py-8" style={{ maxWidth: '900px', margin: '0 auto' }}>
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

      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="font-semibold mb-1" style={{ color: '#111111', fontSize: '24px' }}>Dashboard</h1>
          <p className="text-sm" style={{ color: '#666666' }}>{today}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 mt-0.5">
          <span className="hidden md:block">
            <NotificationBell unreadCount={unreadCount} />
          </span>
          <Link
            href="/pm/team"
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ border: '1px solid #00236F', color: '#00236F' }}
          >
            Invite team
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <SearchIcon />
        </div>
        <input
          type="text"
          placeholder="Search projects or engineers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl outline-none"
          style={{ backgroundColor: '#F5F6FA', border: '1px solid #EEEEEE', color: '#111111' }}
        />
      </div>

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
          <EmptyCard message={q ? 'No projects match your search' : 'No projects yet'} />
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
  )
}
