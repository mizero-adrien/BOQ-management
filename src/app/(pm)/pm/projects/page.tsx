'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePMProjects } from '@/hooks/usePMProjects'
import type { ProjectStatus } from '@/types/database'
import ProjectFullCard from '@/components/pm/projects/ProjectFullCard'
import { SkeletonCard } from '@/components/shared/Skeleton'

type Filter = 'all' | ProjectStatus

const TABS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'completed', label: 'Completed' },
]

export default function PMProjectsPage() {
  const { projects, loading } = usePMProjects()
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = filter === 'all' ? projects : projects.filter((p) => p.status === filter)

  const emptyMsg = filter === 'all'
    ? 'No projects yet. Create your first project to get started.'
    : `No ${filter.replace('_', ' ')} projects.`

  return (
    <div style={{ backgroundColor: '#F5F6FA', minHeight: '100vh', padding: '32px 20px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-semibold mb-1" style={{ color: '#111111', fontSize: '24px' }}>Projects</h1>
          <p className="text-sm" style={{ color: '#666666' }}>Manage your construction projects</p>
        </div>
        <Link href="/pm/projects/new"
          className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white flex-shrink-0"
          style={{ backgroundColor: '#00236F' }}>
          New project
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-6" style={{ scrollbarWidth: 'none' }}>
        {TABS.map(({ value, label }) => (
          <button key={value} type="button" onClick={() => setFilter(value)}
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium"
            style={filter === value
              ? { backgroundColor: '#00236F', color: '#FFFFFF' }
              : { backgroundColor: '#FFFFFF', color: '#666666', border: '1px solid #EEEEEE' }}>
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
        <div className="bg-white rounded-xl p-12 text-center" style={{ border: '1px solid #EEEEEE' }}>
          <p className="font-semibold mb-2" style={{ color: '#111111', fontSize: '16px' }}>No projects found</p>
          <p className="text-sm mb-5" style={{ color: '#666666' }}>{emptyMsg}</p>
          {filter === 'all' && (
            <Link href="/pm/projects/new" className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white inline-block"
              style={{ backgroundColor: '#00236F' }}>
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
  )
}
