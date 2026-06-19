'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useOwnerBOQSummary } from '@/hooks/useOwnerBOQSummary'
import { formatDate, formatCurrency } from '@/lib/utils/index'
import type { Project } from '@/types/database'

function ProgressBar({ pct }: { pct: number }) {
  const color = pct > 90 ? '#E24B4A' : pct > 70 ? '#778EDE' : '#00236F'
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-sm font-medium" style={{ color: '#111111' }}>Overall progress</p>
        <p className="text-sm font-bold" style={{ color }}>{pct}%</p>
      </div>
      <div className="rounded-full overflow-hidden" style={{ height: '12px', backgroundColor: '#EEEEEE' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

export default function OwnerOverviewPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const { sections } = useOwnerBOQSummary(projectId)

  const totalBudget = sections.reduce((s, sec) => s + sec.total_budgeted, 0)
  const totalUsed = sections.reduce((s, sec) => s + sec.total_used, 0)
  const budgetPct = totalBudget > 0 ? Math.round((totalUsed / totalBudget) * 100) : 0

  useEffect(() => {
    if (!projectId) return
    const supabase = createClient()
    supabase.from('projects').select('*').eq('id', projectId).single()
      .then(({ data }) => { setProject(data); setLoading(false) })
  }, [projectId])

  if (loading) {
    return (
      <div className="animate-pulse px-4 py-5 space-y-4">
        <div className="h-8 w-64 rounded" style={{ backgroundColor: '#EEEEEE' }} />
        <div className="h-40 rounded-xl" style={{ backgroundColor: '#EEEEEE' }} />
      </div>
    )
  }

  if (!project) {
    return <div className="px-4 py-12 text-center"><p style={{ color: '#BBBBBB' }}>Project not found.</p></div>
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-8" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 className="font-bold mb-0.5" style={{ color: '#111111', fontSize: '26px' }}>{project.name}</h1>
      <p className="text-sm mb-6" style={{ color: '#666666' }}>{project.client_name}</p>

      <div className="bg-white rounded-xl p-5 mb-4" style={{ border: '0.5px solid #EEEEEE' }}>
        <ProgressBar pct={project.overall_progress} />
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t" style={{ borderColor: '#EEEEEE' }}>
          <div>
            <p className="text-xs" style={{ color: '#666666' }}>Start date</p>
            <p className="text-sm font-semibold mt-0.5" style={{ color: '#111111' }}>{formatDate(project.start_date)}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: '#666666' }}>Expected end</p>
            <p className="text-sm font-semibold mt-0.5" style={{ color: '#111111' }}>{formatDate(project.expected_end_date)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-xl p-4" style={{ border: '0.5px solid #EEEEEE' }}>
          <p className="text-xl font-bold" style={{ color: '#111111' }}>{formatCurrency(totalBudget)}</p>
          <p className="text-xs mt-0.5" style={{ color: '#666666' }}>Total budget</p>
        </div>
        <div className="bg-white rounded-xl p-4" style={{ border: '0.5px solid #EEEEEE' }}>
          <p className="text-xl font-bold" style={{ color: '#00236F' }}>{budgetPct}%</p>
          <p className="text-xs mt-0.5" style={{ color: '#666666' }}>Budget used</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Photos', href: `/owner/${projectId}/photos` },
          { label: 'BOQ', href: `/owner/${projectId}/boq` },
          { label: 'Reports', href: `/owner/${projectId}/reports` },
        ].map((item) => (
          <Link key={item.href} href={item.href}
            className="bg-white rounded-xl py-4 text-sm font-semibold text-center"
            style={{ border: '0.5px solid #EEEEEE', color: '#00236F' }}>
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
