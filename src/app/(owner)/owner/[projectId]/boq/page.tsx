'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'

interface BOQSectionSummary {
  id: string
  title: string
  order_index: number
  status: string
  total_budgeted: number
  total_used: number
  usage_pct: number
}

export default function OwnerBOQPage() {
  const params = useParams()
  const projectId = params.projectId as string

  const [sections, setSections] = useState<BOQSectionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [projectName, setProjectName] = useState('')
  const [totalBudgeted, setTotalBudgeted] = useState(0)
  const [totalUsed, setTotalUsed] = useState(0)

  useEffect(() => {
    if (!projectId) return
    let cancelled = false

    async function fetchBOQ() {
      setLoading(true)
      const supabase = createClient()

      const { data: project } = await supabase
        .from('projects')
        .select('name')
        .eq('id', projectId)
        .single()

      if (project && !cancelled) setProjectName(project.name as string)

      const { data: sectionsData, error: sectionsError } = await supabase
        .from('boq_sections')
        .select('id, title, order_index, status')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true })

      if (cancelled) return
      if (sectionsError || !sectionsData || sectionsData.length === 0) {
        setLoading(false)
        return
      }

      const summaries: BOQSectionSummary[] = []

      for (const section of sectionsData) {
        if (cancelled) break

        const { data: items } = await supabase
          .from('boq_items')
          .select('budgeted_total, used_total')
          .eq('section_id', section.id as string)

        const itemList = items ?? []
        const total_budgeted = itemList.reduce((sum, i) => sum + (Number(i.budgeted_total) || 0), 0)
        const total_used = itemList.reduce((sum, i) => sum + (Number(i.used_total) || 0), 0)
        const usage_pct = total_budgeted > 0
          ? Math.round((total_used / total_budgeted) * 100 * 10) / 10
          : 0

        summaries.push({
          id: section.id as string,
          title: section.title as string,
          order_index: section.order_index as number,
          status: section.status as string,
          total_budgeted,
          total_used,
          usage_pct,
        })
      }

      if (!cancelled) {
        setSections(summaries)
        setTotalBudgeted(summaries.reduce((sum, s) => sum + s.total_budgeted, 0))
        setTotalUsed(summaries.reduce((sum, s) => sum + s.total_used, 0))
        setLoading(false)
      }
    }

    fetchBOQ()
    return () => { cancelled = true }
  }, [projectId])

  const overallPct = totalBudgeted > 0
    ? Math.round((totalUsed / totalBudgeted) * 100 * 10) / 10
    : 0

  function getBarColour(pct: number): string {
    if (pct >= 90) return '#E24B4A'
    if (pct >= 80) return '#778EDE'
    return '#00236F'
  }

  function getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      done: 'Done',
      in_progress: 'In Progress',
      not_started: 'Not Started',
      issue_flagged: 'Issue Flagged',
    }
    return map[status] ?? status
  }

  function getStatusStyle(status: string): React.CSSProperties {
    if (status === 'done') return { backgroundColor: '#111111', color: '#FFFFFF' }
    if (status === 'in_progress') return { backgroundColor: '#E4E9FA', color: '#00236F', border: '0.5px solid #00236F' }
    if (status === 'issue_flagged') return { backgroundColor: '#FFF5F5', color: '#E24B4A', border: '0.5px solid #E24B4A' }
    return { backgroundColor: '#F5F6FA', color: '#666666', border: '0.5px solid #EEEEEE' }
  }

  if (loading) {
    return (
      <div style={{ padding: '32px 24px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ height: '28px', width: '200px', backgroundColor: '#EEEEEE', borderRadius: '6px', marginBottom: '8px' }} className="animate-pulse" />
        <div style={{ height: '16px', width: '160px', backgroundColor: '#EEEEEE', borderRadius: '6px', marginBottom: '24px' }} className="animate-pulse" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: '80px', backgroundColor: '#EEEEEE', borderRadius: '12px' }} className="animate-pulse" />
          ))}
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ height: '70px', backgroundColor: '#EEEEEE', borderRadius: '10px', marginBottom: '8px' }} className="animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111111', marginBottom: '4px' }}>
          Bill of Quantities
        </h1>
        <p style={{ fontSize: '14px', color: '#666666', marginBottom: '2px' }}>{projectName}</p>
        <p style={{ fontSize: '13px', color: '#BBBBBB' }}>
          Budget summary — detailed line items are managed by your project team
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '0.5px solid #EEEEEE', padding: '20px' }}>
          <p style={{ fontSize: '22px', fontWeight: '600', color: '#00236F', marginBottom: '4px' }}>
            {formatCurrency(totalBudgeted)}
          </p>
          <p style={{ fontSize: '12px', color: '#666666' }}>Total budget</p>
        </div>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '0.5px solid #EEEEEE', padding: '20px' }}>
          <p style={{ fontSize: '22px', fontWeight: '600', color: overallPct >= 80 ? '#E24B4A' : '#111111', marginBottom: '4px' }}>
            {formatCurrency(totalUsed)}
          </p>
          <p style={{ fontSize: '12px', color: '#666666' }}>Amount spent</p>
        </div>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '0.5px solid #EEEEEE', padding: '20px' }}>
          <p style={{ fontSize: '22px', fontWeight: '600', color: '#00236F', marginBottom: '6px' }}>
            {overallPct}%
          </p>
          <div style={{ backgroundColor: '#EEEEEE', borderRadius: '4px', height: '6px', overflow: 'hidden', marginBottom: '4px' }}>
            <div style={{ width: `${Math.min(overallPct, 100)}%`, height: '100%', backgroundColor: getBarColour(overallPct), borderRadius: '4px' }} />
          </div>
          <p style={{ fontSize: '12px', color: '#666666' }}>Budget used</p>
        </div>
      </div>

      {sections.length === 0 ? (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '0.5px solid #EEEEEE', padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', fontWeight: '600', color: '#111111', marginBottom: '8px' }}>No BOQ data yet</p>
          <p style={{ fontSize: '14px', color: '#BBBBBB' }}>Your project manager has not added any BOQ sections yet.</p>
        </div>
      ) : (
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#BBBBBB', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px' }}>
            Sections
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sections.map((section) => (
              <div key={section.id} style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '0.5px solid #EEEEEE', padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <p style={{ fontSize: '15px', fontWeight: '600', color: '#111111' }}>{section.title}</p>
                  <span style={{ fontSize: '11px', fontWeight: '500', padding: '3px 10px', borderRadius: '20px', ...getStatusStyle(section.status) }}>
                    {getStatusLabel(section.status)}
                  </span>
                </div>
                <div style={{ backgroundColor: '#EEEEEE', borderRadius: '4px', height: '6px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{ width: `${Math.min(section.usage_pct, 100)}%`, height: '100%', backgroundColor: getBarColour(section.usage_pct), borderRadius: '4px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <div>
                      <p style={{ fontSize: '12px', color: '#BBBBBB', marginBottom: '1px' }}>Budget</p>
                      <p style={{ fontSize: '13px', fontWeight: '500', color: '#111111' }}>{formatCurrency(section.total_budgeted)}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: '#BBBBBB', marginBottom: '1px' }}>Spent</p>
                      <p style={{ fontSize: '13px', fontWeight: '500', color: section.usage_pct >= 80 ? '#E24B4A' : '#111111' }}>{formatCurrency(section.total_used)}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: getBarColour(section.usage_pct) }}>
                    {section.usage_pct}%
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ backgroundColor: '#00236F', borderRadius: '12px', padding: '16px 20px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.8)' }}>Grand total</p>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '16px', fontWeight: '700', color: '#FFFFFF' }}>{formatCurrency(totalUsed)} spent</p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>of {formatCurrency(totalBudgeted)} budgeted</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
