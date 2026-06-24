'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { usePMProjects } from '@/hooks/usePMProjects'
import { usePMReports } from '@/hooks/usePMReports'
import type { ReportStatus } from '@/types/database'
import ReportsTable from '@/components/pm/reports/ReportsTable'
import ReportCard from '@/components/pm/ReportCard'
import NoProjectsEmptyState from '@/components/pm/NoProjectsEmptyState'
import ProjectsFetchError from '@/components/pm/ProjectsFetchError'
import { SkeletonTable } from '@/components/shared/Skeleton'
import PMTopBar from '@/components/pm/PMTopBar'

function sevenDaysAgo() {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d.toISOString().split('T')[0]
}
function todayStr() { return new Date().toISOString().split('T')[0] }

const STATUS_PILLS: ['' | ReportStatus, string][] = [['', 'All'], ['submitted', 'Submitted'], ['draft', 'Draft']]

export default function PMReportsPage() {
  const { projects, loading: projectsLoading, error: projectsError } = usePMProjects()
  const [projectId, setProjectId] = useState('')
  const [dateFrom, setDateFrom] = useState(sevenDaysAgo)
  const [dateTo, setDateTo]     = useState(todayStr)
  const [status, setStatus]     = useState<'' | ReportStatus>('')
  const [searchTerm, setSearchTerm] = useState('')

  const { reports, loading } = usePMReports(projects, projectId, dateFrom, dateTo, status, searchTerm)
  const isLoading = projectsLoading || loading

  function resetFilters() {
    setProjectId(''); setDateFrom(sevenDaysAgo()); setDateTo(todayStr()); setStatus(''); setSearchTerm('')
  }

  const emptyMsg = searchTerm
    ? 'No reports match your search'
    : (dateFrom !== sevenDaysAgo() || dateTo !== todayStr())
      ? 'No reports in this date range'
      : 'No reports have been submitted yet'

  if (!projectsLoading && projectsError) return <ProjectsFetchError />

  if (!projectsLoading && projects.length === 0) {
    return (
      <NoProjectsEmptyState
        pageTitle="Reports"
        pageSubtitle="Daily reports from your site engineers"
        icon={
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00236F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        }
        body="Create a project first to start receiving daily reports from your site engineers."
      />
    )
  }

  return (
    <>
      <PMTopBar
        title="Reports"
        searchPlaceholder="Search by engineer name"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <div style={{ backgroundColor: '#F4F6F8', minHeight: '100vh', padding: '32px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* Filters (no search input here — moved to top bar) */}
          <div className="flex flex-wrap items-center gap-2.5 mb-5">
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg outline-none w-full md:w-[200px]"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE', color: '#111111' }}>
              <option value="">All projects</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <div className="flex items-center gap-1.5">
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg outline-none"
                style={{ width: '140px', backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE', color: '#111111' }} />
              <span className="text-sm" style={{ color: '#BBBBBB' }}>to</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg outline-none"
                style={{ width: '140px', backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE', color: '#111111' }} />
            </div>

            <div className="flex items-center gap-1">
              {STATUS_PILLS.map(([val, label]) => (
                <button key={label} type="button" onClick={() => setStatus(val)}
                  className="px-3 py-2 text-sm rounded-full font-medium"
                  style={status === val ? { backgroundColor: '#00236F', color: '#FFFFFF' } : { color: '#666666', border: '1px solid #EEEEEE' }}>
                  {label}
                </button>
              ))}
            </div>

            <button type="button" onClick={resetFilters} className="text-sm ml-auto" style={{ color: '#666666' }}>
              Reset filters
            </button>
          </div>

          {/* Content */}
          {isLoading ? (
            <SkeletonTable rows={6} />
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#BBBBBB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <p className="font-semibold mb-1" style={{ color: '#111111', fontSize: '16px' }}>No reports found</p>
              <p className="text-sm" style={{ color: '#666666' }}>{emptyMsg}</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block"><ReportsTable reports={reports} /></div>
              <div className="md:hidden">{reports.map((r) => <ReportCard key={r.id} report={r} />)}</div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
