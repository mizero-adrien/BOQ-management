'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useActiveProject } from '@/hooks/useActiveProject'
import { useBOQSections } from '@/hooks/useBOQSections'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import SectionCard from '@/components/boq/SectionCard'
import { SkeletonStats, SkeletonTable } from '@/components/shared/Skeleton'

export default function BOQPage() {
  const router = useRouter()
  const { project, loading: projectLoading } = useActiveProject()
  const { sections, loading: sectionsLoading } = useBOQSections(project?.id)
  const [logsToday, setLogsToday] = useState(0)

  useEffect(() => {
    if (!project) return
    async function fetchLogsToday() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const today = new Date().toISOString().split('T')[0]
      const { data: reportData } = await supabase
        .from('daily_reports').select('id').eq('engineer_id', user.id).eq('report_date', today).limit(1).maybeSingle()
      if (reportData) {
        const { count } = await supabase
          .from('material_logs').select('id', { count: 'exact', head: true }).eq('report_id', reportData.id)
        setLogsToday(count ?? 0)
      }
    }
    fetchLogsToday()
  }, [project?.id])

  const totalItems = sections.reduce((s, sec) => s + sec.items.length, 0)
  const completeSections = sections.filter((s) => s.status === 'done').length
  const firstActiveSection = sections.find((s) => s.status !== 'done')

  return (
    <div style={{ backgroundColor: '#F5F6FA' }}>
      {projectLoading || sectionsLoading ? (
        <div className="px-4 pt-5"><SkeletonStats count={2} /><SkeletonTable rows={4} /></div>
      ) : !project ? (
        <div className="px-4 pt-10">
          <div className="w-full rounded-xl border p-6 text-center" style={{ backgroundColor: '#FFFFFF', borderColor: '#EEEEEE' }}>
            <p className="text-base font-semibold mb-2" style={{ color: '#111111' }}>No active project</p>
            <p className="text-sm mb-5" style={{ color: '#666666' }}>You are not assigned to any active project yet.</p>
            <button type="button" onClick={() => router.push('/dashboard')}
              className="w-full py-3 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: '#00236F' }}>
              Go to dashboard
            </button>
          </div>
        </div>
      ) : (
        <div className="px-4 pt-5 pb-24 md:pb-6 md:px-0">
          {/* Quantity summary */}
          <div className="bg-white rounded-xl border p-4 mb-4" style={{ borderColor: '#EEEEEE' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#BBBBBB' }}>
              Project overview
            </p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-bold" style={{ color: '#00236F' }}>{sections.length}</p>
                <p className="text-xs mt-0.5" style={{ color: '#666666' }}>{sections.length === 1 ? 'section' : 'sections'}, {totalItems} items</p>
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: '#111111' }}>{completeSections}/{sections.length}</p>
                <p className="text-xs mt-0.5" style={{ color: '#666666' }}>Complete</p>
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: logsToday > 0 ? '#5DCAA5' : '#BBBBBB' }}>{logsToday}</p>
                <p className="text-xs mt-0.5" style={{ color: '#666666' }}>Logged today</p>
              </div>
            </div>
          </div>

          {/* Confidentiality notice */}
          <div className="mb-4 px-3 py-2.5 rounded-lg" style={{ backgroundColor: '#E4E9FA', border: '1px solid #C8D4F8' }}>
            <p style={{ fontSize: '12px', color: '#00236F' }}>
              You can see quantities and usage for this project. Financial details are managed by your project manager.
            </p>
          </div>

          {sections.length === 0 ? (
            <div className="bg-white rounded-xl p-5 text-center border" style={{ borderColor: '#EEEEEE' }}>
              <p className="text-sm font-medium" style={{ color: '#111111' }}>No sections in this project yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sections.map((section) => <SectionCard key={section.id} section={section} />)}
            </div>
          )}

          {firstActiveSection && (
            <div className="fixed bottom-20 left-0 right-0 px-4 pb-2 md:static md:px-0 md:pb-0 md:mt-4 z-10">
              <Link href={`/boq/${firstActiveSection.id}/log`}
                className="block w-full py-4 rounded-xl text-sm font-semibold text-white text-center"
                style={{ backgroundColor: '#00236F' }}>
                Log today's usage
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
