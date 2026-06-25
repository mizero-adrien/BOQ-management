'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePMProjects } from '@/hooks/usePMProjects'
import type { ProjectStatus } from '@/types/database'
import ProjectFullCard from '@/components/pm/projects/ProjectFullCard'
import { SkeletonCard } from '@/components/shared/Skeleton'
import PMTopBar from '@/components/pm/PMTopBar'

type Filter = 'all' | ProjectStatus

const TABS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'completed', label: 'Completed' },
]

const PlusIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

export default function PMProjectsPage() {
  const { projects, loading } = usePMProjects()
  const [filter, setFilter] = useState<Filter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const byStatus = filter === 'all' ? projects : projects.filter((p) => p.status === filter)
  const filtered = searchQuery.trim()
    ? byStatus.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : byStatus

  const emptyMsg = searchQuery.trim()
    ? 'No projects match your search'
    : filter === 'all'
      ? 'No projects yet. Create your first project to get started.'
      : `No ${filter.replace('_', ' ')} projects.`

  return (
    <>
      <PMTopBar
        title="Projects"
        searchPlaceholder="Search projects"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div style={{ backgroundColor: '#F4F6F8', minHeight: '100vh', padding: '32px 20px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* Action row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '16px' }}>
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
          </div>

          {/* Status filter tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 mb-6" style={{ scrollbarWidth: 'none' }}>
            {TABS.map(({ value, label }) => (
              <button key={value} type="button" onClick={() => setFilter(value)}
                className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium"
                style={filter === value
                  ? { backgroundColor: '#1565D8', color: '#FFFFFF' }
                  : { backgroundColor: '#FFFFFF', color: '#666666', border: '1px solid #DDE3E8' }}>
                {label}
              </button>
            ))}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} height="200px" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center" style={{ border: '1px solid #DDE3E8' }}>
              <p className="font-semibold mb-2" style={{ color: '#1A2332', fontSize: '16px' }}>No projects found</p>
              <p className="text-sm mb-5" style={{ color: '#8FA3B3' }}>{emptyMsg}</p>
              {filter === 'all' && !searchQuery.trim() && (
                <Link href="/pm/projects/new" className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white inline-block"
                  style={{ backgroundColor: '#1565D8' }}>
                  Create first project
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((p) => <ProjectFullCard key={p.id} project={p} />)}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
