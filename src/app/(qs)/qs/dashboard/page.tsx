'use client'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { useActiveProject } from '@/hooks/useActiveProject'
import { useBOQSections } from '@/hooks/useBOQSections'
import { useMaterialLogs } from '@/hooks/useMaterialLogs'
import BudgetCard from '@/components/qs/BudgetCard'
import { formatDate, formatCurrency } from '@/lib/utils/index'
import { SkeletonStats, SkeletonTable } from '@/components/shared/Skeleton'

function progressColor(pct: number) {
  if (pct > 90) return '#E24B4A'
  if (pct > 70) return '#778EDE'
  return '#00236F'
}

export default function QSDashboardPage() {
  const { project, loading: projectLoading } = useActiveProject()
  const { sections, loading: boqLoading } = useBOQSections(project?.id)
  const { logs } = useMaterialLogs(project?.id)
  const recentLogs = logs.slice(0, 10)

  if (projectLoading || boqLoading) {
    return (
      <div className="px-4 pt-6 md:px-8 md:pt-8" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <SkeletonStats count={3} />
        <SkeletonTable rows={5} />
      </div>
    )
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-8" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="mb-6">
        <h1 className="font-semibold mb-0.5" style={{ color: '#111111', fontSize: '24px' }}>Cost Control Dashboard</h1>
        <p className="text-sm" style={{ color: '#666666' }}>{project?.name} — {formatDate(new Date().toISOString())}</p>
      </div>

      {project && <BudgetCard projectName={project.name} sections={sections} />}

      {/* BOQ Sections summary */}
      <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: '#BBBBBB' }}>BOQ Sections</h2>
      {sections.length === 0 ? (
        <div className="bg-white rounded-xl px-8 py-10 flex flex-col items-center text-center mb-4" style={{ border: '0.5px solid #EEEEEE' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#BBBBBB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="3" y1="15" x2="21" y2="15" />
            <line x1="9" y1="9" x2="9" y2="21" />
          </svg>
          <p className="mt-3 text-sm font-semibold" style={{ color: '#111111' }}>No BOQ sections yet</p>
          <p className="mt-1 text-xs" style={{ color: '#BBBBBB' }}>Ask your project manager to create BOQ sections so you can start tracking costs.</p>
        </div>
      ) : (
        <div className="space-y-2 mb-6">
          {sections.map((s) => (
            <Link key={s.id} href={`/qs/boq/${s.id}`}
              className="block bg-white rounded-xl px-4 py-3.5" style={{ border: '0.5px solid #EEEEEE' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium" style={{ color: '#111111' }}>{s.title}</p>
                <div className="text-right">
                  <p className="text-xs" style={{ color: '#666666' }}>{formatCurrency(s.total_used)} / {formatCurrency(s.total_budgeted)}</p>
                  <p className="text-xs font-semibold" style={{ color: progressColor(s.usage_pct) }}>{s.usage_pct}%</p>
                </div>
              </div>
              <div className="rounded-full overflow-hidden" style={{ height: '4px', backgroundColor: '#EEEEEE' }}>
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, s.usage_pct)}%`, backgroundColor: progressColor(s.usage_pct) }} />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Recent material logs */}
      <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: '#BBBBBB' }}>Recent Material Usage</h2>
      {recentLogs.length === 0 ? (
        <div className="bg-white rounded-xl p-5 text-center" style={{ border: '0.5px solid #EEEEEE' }}>
          <p className="text-sm" style={{ color: '#BBBBBB' }}>No material logs yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: '0.5px solid #EEEEEE' }}>
          {recentLogs.map((log, i) => (
            <div key={log.id} className={`flex items-center gap-3 px-4 py-3 ${i < recentLogs.length - 1 ? 'border-b' : ''}`}
              style={{ borderColor: '#EEEEEE', backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#F5F6FA' }}>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: '#111111' }}>{log.itemDescription}</p>
                <p className="text-xs mt-0.5" style={{ color: '#666666' }}>{log.engineerName} — {formatDate(log.loggedAt)}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-medium" style={{ color: '#111111' }}>{log.quantityUsed} {log.unit}</p>
                <p className="text-xs" style={{ color: '#666666' }}>{formatCurrency(log.costRwf)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
