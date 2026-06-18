'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useProjectDetail } from '@/hooks/useProjectDetail'
import type { ProjectStatus } from '@/types/database'
import OverviewTab from '@/components/pm/projects/OverviewTab'
import TeamTab from '@/components/pm/projects/TeamTab'
import BOQTab from '@/components/pm/projects/BOQTab'
import FloorPlanTab from '@/components/pm/projects/FloorPlanTab'

type Tab = 'overview' | 'team' | 'boq' | 'floor-plan'

const TABS: { value: Tab; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'team', label: 'Team' },
  { value: 'boq', label: 'BOQ' },
  { value: 'floor-plan', label: 'Floor Plan' },
]

function StatusBadge({ status }: { status: ProjectStatus }) {
  if (status === 'active') return <span className="text-xs font-medium px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: '#00236F' }}>Active</span>
  if (status === 'completed') return <span className="text-xs font-medium px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: '#111111' }}>Completed</span>
  return <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ color: '#666666', border: '1px solid #EEEEEE' }}>On hold</span>
}

export default function ProjectDetailPage() {
  const { projectId } = useParams() as { projectId: string }
  const router = useRouter()
  const { project, loading, updateProject } = useProjectDetail(projectId)
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  if (loading) {
    return (
      <div style={{ backgroundColor: '#F5F6FA', minHeight: '100vh', padding: '32px 20px' }}>
        <div className="px-4 py-5 md:px-8 md:py-8" style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {[1, 2, 3].map((i) => <div key={i} className="rounded-xl animate-pulse mb-3" style={{ height: '80px', backgroundColor: '#EEEEEE' }} />)}
        </div>
      </div>
    )
  }
  if (!project) {
    return (
      <div style={{ backgroundColor: '#F5F6FA', minHeight: '100vh', padding: '32px 20px' }}>
        <div className="px-4 py-5 md:px-8 md:py-8 text-center">
          <p style={{ color: '#666666' }}>Project not found.</p>
          <button type="button" onClick={() => router.push('/pm/projects')} className="mt-3 text-sm" style={{ color: '#00236F' }}>Back to projects</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#F5F6FA', minHeight: '100vh', padding: '32px 20px' }}>
      <div className="px-4 py-5 md:px-8 md:py-8" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <button type="button" onClick={() => router.push('/pm/projects')} className="flex-shrink-0 mt-1"
          style={{ color: '#666666' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="font-semibold" style={{ color: '#111111', fontSize: '24px' }}>{project.name}</h1>
            <StatusBadge status={project.status} />
          </div>
          <p className="text-sm" style={{ color: '#666666' }}>{project.client_name} · {project.location}</p>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-0 mb-6 overflow-x-auto" style={{ borderBottom: '1px solid #EEEEEE' }}>
        {TABS.map(({ value, label }) => (
          <button key={value} type="button" onClick={() => setActiveTab(value)}
            className="px-4 py-3 text-sm font-medium flex-shrink-0"
            style={activeTab === value
              ? { color: '#00236F', borderBottom: '2px solid #00236F', marginBottom: '-1px' }
              : { color: '#666666' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && <OverviewTab project={project} onUpdate={updateProject} />}
      {activeTab === 'team' && <TeamTab project={project} />}
      {activeTab === 'boq' && <BOQTab projectId={projectId} />}
      {activeTab === 'floor-plan' && (
        <FloorPlanTab project={project} onPlanUpdated={(url) => updateProject({ plan_image_url: url })} />
      )}
      </div>
    </div>
  )
}
