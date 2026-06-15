'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { usePMProjects } from '@/hooks/usePMProjects'
import { usePMReports } from '@/hooks/usePMReports'
import type { ReportStatus } from '@/types/database'
import ReportsTable from '@/components/pm/reports/ReportsTable'
import ReportCard from '@/components/pm/ReportCard'
import { SkeletonTable } from '@/components/shared/Skeleton'

function sevenDaysAgo() {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d.toISOString().split('T')[0]
}
function todayStr() { return new Date().toISOString().split('T')[0] }

const STATUS_PILLS: ['' | ReportStatus, string][] = [['', 'All'], ['submitted', 'Submitted'], ['draft', 'Draft']]

export default function PMReportsPage() {
  const { projects, loading: projectsLoading } = usePMProjects()
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

  return (
    <div style={{ backgroundColor: '#F5F6FA', minHeight: '100vh', padding: '32px 20px' }}>
      <div className="px-4 py-5 md:px-8 md:py-8" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="mb-6">
        <h1 className="font-semibold mb-1" style={{ color: '#111111', fontSize: '24px' }}>Reports</h1>
        <p className="text-sm" style={{ color: '#666666' }}>Daily reports from your site engineers</p>
      </div>

      {/* Filters */}
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

        <div className="relative w-full md:w-[220px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#BBBBBB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" placeholder="Search by engineer name" value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg outline-none"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE', color: '#111111' }} />
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
  )
}
