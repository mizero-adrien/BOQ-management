'use client'

export const dynamic = 'force-dynamic'

import { useActiveProject } from '@/hooks/useActiveProject'
import { useBOQSections, type SectionWithItems } from '@/hooks/useBOQSections'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatCurrency, calculatePercentage } from '@/lib/utils'
import BudgetProgressBar from '@/components/boq/BudgetProgressBar'
import SectionCard from '@/components/boq/SectionCard'
import { SkeletonStats, SkeletonTable } from '@/components/shared/Skeleton'

export default function BOQPage() {
  const router = useRouter()
  const { project, loading: projectLoading } = useActiveProject()
  const { sections, loading: sectionsLoading } = useBOQSections(project?.id)

  const subtitle = !project
    ? 'No project assigned'
    : project.name

  const totalBudget = sections.reduce((s, sec) => s + sec.total_budgeted, 0)
  const totalUsed = sections.reduce((s, sec) => s + sec.total_used, 0)
  const overallPct = calculatePercentage(totalUsed, totalBudget)

  const firstActiveSection = sections.find(
    (s) => s.status !== 'done'
  )

  return (
    <div style={{ backgroundColor: '#F5F6FA' }}>
      {/* Header — always shown */}
      <div
        className="bg-white pt-4 pb-3 px-4 border-b"
        style={{ borderColor: '#EEEEEE' }}
      >
        <h1 className="text-xl font-semibold" style={{ color: '#111111' }}>
          BOQ Tracker
        </h1>
        <p className="text-sm mt-0.5" style={{ color: '#666666' }}>
          {projectLoading ? '' : subtitle}
        </p>
      </div>

      {projectLoading || sectionsLoading ? (
        <div className="px-4 pt-5">
          <SkeletonStats count={2} />
          <SkeletonTable rows={4} />
        </div>
      ) : !project ? (
        <div className="px-4 pt-10">
          <div
            className="w-full rounded-xl border p-6 text-center"
            style={{ backgroundColor: '#FFFFFF', borderColor: '#EEEEEE' }}
          >
            <p className="text-base font-semibold mb-2" style={{ color: '#111111' }}>
              No active project
            </p>
            <p className="text-sm mb-5" style={{ color: '#666666' }}>
              You are not assigned to any active project yet. Ask your project manager to add you to a project.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-opacity active:opacity-80"
              style={{ backgroundColor: '#00236F' }}
            >
              Go to dashboard
            </button>
          </div>
        </div>
      ) : (
        <div className="px-4 pt-5 pb-24 md:pb-6 md:px-0">
          {/* Summary card */}
          <div
            className="bg-white rounded-xl border p-4 mb-5"
            style={{ borderColor: '#EEEEEE' }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: '#BBBBBB' }}
            >
              Overall budget
            </p>
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-3xl font-bold" style={{ color: '#00236F' }}>
                  {overallPct}%
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#666666' }}>
                  Used of total budget
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold" style={{ color: '#111111' }}>
                  {formatCurrency(totalUsed)}
                </p>
                <p className="text-xs" style={{ color: '#666666' }}>
                  of {formatCurrency(totalBudget)}
                </p>
              </div>
            </div>
            <BudgetProgressBar used={totalUsed} total={totalBudget} height={8} />
          </div>

          {/* Section list */}
          {sections.length === 0 ? (
            <div
              className="bg-white rounded-xl p-5 text-center border"
              style={{ borderColor: '#EEEEEE' }}
            >
              <p className="text-sm font-medium" style={{ color: '#111111' }}>
                No sections in this project yet
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sections.map((section) => (
                <SectionCard
                  key={section.id}
                  section={section}
                />
              ))}
            </div>
          )}

          {/* Fixed log button */}
          {firstActiveSection && (
            <div className="fixed bottom-20 left-0 right-0 px-4 pb-2 md:static md:px-0 md:pb-0 md:mt-4 z-10">
              <Link
                href={`/boq/${firstActiveSection.id}/log`}
                className="block w-full py-4 rounded-xl text-sm font-semibold text-white text-center transition-opacity active:opacity-80"
                style={{ backgroundColor: '#00236F' }}
              >
                Log today's usage
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
