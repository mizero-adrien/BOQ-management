export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import type { Project, PlanZone } from '@/types/database'
import ShareHeader from '@/components/share/ShareHeader'
import ShareStats from '@/components/share/ShareStats'
import ShareFloorPlan from '@/components/share/ShareFloorPlan'
import ShareBOQ from '@/components/share/ShareBOQ'
import ShareActivity from '@/components/share/ShareActivity'

interface Props {
  params: Promise<{ token: string }>
}

export default async function SharePage({ params }: Props) {
  const { token } = await params
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('share_token', token)
    .single()

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: '#F5F6FA' }}>
        <div className="bg-white rounded-2xl p-10 text-center" style={{ border: '1px solid #EEEEEE', maxWidth: '400px' }}>
          <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#FEE2E2' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#E24B4A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <h1 className="font-bold mb-2" style={{ color: '#111111', fontSize: '18px' }}>Link expired or invalid</h1>
          <p className="text-sm" style={{ color: '#666666' }}>This project dashboard link is no longer valid. Contact the project manager for an updated link.</p>
        </div>
      </div>
    )
  }

  const today = new Date().toISOString().split('T')[0]

  const [zonesRes, reportsRes, sectionsRes, tasksRes] = await Promise.all([
    supabase.from('plan_zones').select('*').eq('project_id', project.id).order('created_at'),
    supabase.from('daily_reports').select('id, report_date, workers_count, progress_pct, issues, status, photos:report_photos(id, url, caption)').eq('project_id', project.id).order('report_date', { ascending: false }).limit(15),
    supabase.from('boq_sections').select('id, title, order_index, items:boq_items(budgeted_total, used_total)').eq('project_id', project.id).order('order_index'),
    supabase.from('tasks').select('id, title, due_date, status').eq('project_id', project.id).in('status', ['not_started', 'in_progress', 'overdue']).order('due_date').limit(8),
  ])

  const zones = (zonesRes.data ?? []) as PlanZone[]
  const reports = reportsRes.data ?? []
  const rawSections = sectionsRes.data ?? []
  const tasks = tasksRes.data ?? []

  type RawItem = { budgeted_total: number; used_total: number }
  const sections = rawSections.map((s) => {
    const items = (s.items as RawItem[]) ?? []
    return {
      id: s.id,
      title: s.title,
      total_budgeted: items.reduce((sum, i) => sum + (i.budgeted_total ?? 0), 0),
      total_used: items.reduce((sum, i) => sum + (i.used_total ?? 0), 0),
      items_count: items.length,
    }
  })

  const totalBudgeted = sections.reduce((s, sec) => s + sec.total_budgeted, 0)
  const totalUsed = sections.reduce((s, sec) => s + sec.total_used, 0)
  const submittedReports = reports.filter((r) => r.status === 'submitted')
  const todayReports = reports.filter((r) => r.report_date === today)
  const workersToday = todayReports.reduce((s, r) => s + (r.workers_count ?? 0), 0)
  const openIssues = reports.filter((r) => r.issues && r.issues.trim() !== '').length

  type PhotoRow = { id: string; url: string; caption: string | null }
  const recentPhotos: PhotoRow[] = reports.flatMap((r) => (r.photos as PhotoRow[]) ?? []).slice(0, 9)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F6FA' }}>
      <div className="px-4 py-8 md:px-10 md:py-10" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Powered by badge */}
        <div className="flex justify-end mb-4">
          <span className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: '#E4E9FA', color: '#00236F' }}>
            Powered by SiteFlow
          </span>
        </div>

        <ShareHeader project={project as Project} />

        <ShareStats
          totalBudgeted={totalBudgeted}
          totalUsed={totalUsed}
          totalReports={submittedReports.length}
          workersToday={workersToday}
          openIssues={openIssues}
        />

        {/* Recent photos */}
        {recentPhotos.length > 0 && (
          <div className="bg-white rounded-xl p-5 mb-6" style={{ border: '0.5px solid #EEEEEE' }}>
            <p className="text-sm font-semibold mb-3" style={{ color: '#111111' }}>Recent Site Photos</p>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {recentPhotos.map((photo) => (
                <div key={photo.id} className="rounded-lg overflow-hidden" style={{ aspectRatio: '1 / 1' }}>
                  <img src={photo.url} alt={photo.caption ?? 'Site photo'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              ))}
            </div>
          </div>
        )}

        <ShareFloorPlan planImageUrl={project.plan_image_url} zones={zones} />
        <ShareBOQ sections={sections} />
        <ShareActivity
          tasks={tasks.map((t) => ({ id: t.id, title: t.title, due_date: t.due_date, status: t.status }))}
          reports={reports.slice(0, 6).map((r) => ({ id: r.id, report_date: r.report_date, workers_count: r.workers_count, progress_pct: r.progress_pct, issues: r.issues }))}
        />
      </div>
    </div>
  )
}
