'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePMProjects } from '@/hooks/usePMProjects'
import AnalyticsStatCards, { type ProjectAnalytics } from '@/components/pm/analytics/AnalyticsStatCards'
import AIInsightsPanel from '@/components/pm/analytics/AIInsightsPanel'
import TopCostItems from '@/components/pm/analytics/TopCostItems'

export default function PMAnalyticsPage() {
  const { projects } = usePMProjects()
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<ProjectAnalytics | null>(null)
  const [companyData, setCompanyData] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) setSelectedProjectId(projects[0].id)
  }, [projects, selectedProjectId])

  useEffect(() => {
    if (selectedProjectId) void fetchAnalytics(selectedProjectId)
  }, [selectedProjectId])

  async function fetchAnalytics(projectId: string) {
    setLoading(true)
    setAnalytics(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: member } = await supabase
      .from('company_members').select('company_id').eq('user_id', user.id).single()

    const [projectResult, companyResult] = await Promise.all([
      supabase.rpc('get_project_analytics', { p_project_id: projectId }),
      member?.company_id
        ? supabase.rpc('get_company_analytics', { p_company_id: member.company_id })
        : Promise.resolve({ data: null }),
    ])

    if (projectResult.data) setAnalytics(projectResult.data as ProjectAnalytics)
    setCompanyData(companyResult.data)
    setLoading(false)
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#111111', marginBottom: '4px' }}>AI Analytics</h1>
          <p style={{ fontSize: '14px', color: '#666666' }}>Intelligent insights powered by your project data</p>
        </div>
        {projects.length > 1 && (
          <select value={selectedProjectId ?? ''} onChange={(e) => setSelectedProjectId(e.target.value)}
            style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '8px', border: '0.5px solid #EEEEEE', backgroundColor: '#FFFFFF', color: '#111111', outline: 'none' }}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse" style={{ height: '90px', backgroundColor: '#EEEEEE', borderRadius: '12px' }} />
          ))}
        </div>
      ) : analytics ? (
        <AnalyticsStatCards a={analytics} />
      ) : null}

      <AIInsightsPanel projectData={analytics} companyData={companyData} />

      {analytics && analytics.top_cost_items?.length > 0 && (
        <TopCostItems items={analytics.top_cost_items} />
      )}
    </div>
  )
}
