'use client'

import { useState } from 'react'
import { toast } from '@/lib/toast'
import Spinner from '@/components/shared/Spinner'

interface AIInsight {
  type: 'health' | 'budget' | 'schedule' | 'prediction' | 'recommendation'
  title: string
  content: string
  severity: 'good' | 'warning' | 'critical' | 'info'
}

const SEV: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  good:     { bg: '#F0FFF8', border: '#5DCAA5', text: '#0F6E56', dot: '#5DCAA5' },
  warning:  { bg: '#FFFBF0', border: '#EF9F27', text: '#854F0B', dot: '#EF9F27' },
  critical: { bg: '#FFF5F5', border: '#E24B4A', text: '#B91C1C', dot: '#E24B4A' },
  info:     { bg: '#E4E9FA', border: '#778EDE', text: '#00236F', dot: '#778EDE' },
}

const TYPE_SVG: Record<string, string> = {
  health:         'M22 12 18 12 15 21 9 3 6 12 2 12',
  budget:         'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  schedule:       '',
  prediction:     'M13 2 3 14 12 14 11 22 21 10 12 10 13 2',
  recommendation: '',
}

function InsightIcon({ type }: { type: string }) {
  if (type === 'schedule') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  )
  if (type === 'recommendation') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
  const d = TYPE_SVG[type] ?? ''
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points={d} />
    </svg>
  )
}

export default function AIInsightsPanel({ projectData, companyData }: { projectData: unknown; companyData: unknown }) {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [generating, setGenerating] = useState(false)
  const [healthScore, setHealthScore] = useState<number | null>(null)

  async function generate() {
    if (!projectData) { toast.warning('No data yet', 'Add BOQ data and daily reports first'); return }
    setGenerating(true)
    setInsights([])
    try {
      const prompt = `You are an AI assistant for a construction project management platform used in Rwanda. All monetary values are in RWF.\n\nAnalyse this project data and provide structured insights:\n\nPROJECT DATA:\n${JSON.stringify(projectData, null, 2)}\n\nCOMPANY BENCHMARKS:\n${JSON.stringify(companyData, null, 2)}\n\nRespond ONLY with a valid JSON array of 5 insight objects. No preamble, no markdown outside the JSON.\n\nEach insight: { "type": "health"|"budget"|"schedule"|"prediction"|"recommendation", "title": "<8 words max>", "content": "<2-3 sentences with actual numbers>", "severity": "good"|"warning"|"critical"|"info" }\n\nFor the health insight start content with "Health score: X/100."`
      const res = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, max_tokens: 1000 }) })
      if (!res.ok) throw new Error('API error')
      const { text } = await res.json() as { text: string }
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim()) as AIInsight[]
      const health = parsed.find((i) => i.type === 'health')
      if (health) {
        const m = health.content.match(/Health score:\s*(\d+)\/100/)
        if (m) setHealthScore(parseInt(m[1]))
      }
      setInsights(parsed)
      toast.success('AI insights generated', 'Analysis complete')
    } catch {
      toast.error('Could not generate insights', 'Please try again')
    }
    setGenerating(false)
  }

  const scoreColor = healthScore === null ? '#BBBBBB' : healthScore >= 70 ? '#5DCAA5' : healthScore >= 50 ? '#EF9F27' : '#E24B4A'

  return (
    <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '0.5px solid #EEEEEE', padding: '24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: insights.length > 0 ? '20px' : '0' }}>
        <div>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#111111', marginBottom: '2px' }}>AI Project Analysis</p>
          <p style={{ fontSize: '13px', color: '#666666' }}>{insights.length > 0 ? `${insights.length} insights generated` : 'Click to analyse your project with AI'}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {healthScore !== null && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '28px', fontWeight: 700, color: scoreColor, lineHeight: 1 }}>{healthScore}</p>
              <p style={{ fontSize: '10px', color: '#BBBBBB', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Health</p>
            </div>
          )}
          <button type="button" onClick={generate} disabled={generating}
            style={{ padding: '10px 20px', backgroundColor: generating ? '#BBBBBB' : '#00236F', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: generating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {generating && <Spinner size={14} />}
            {generating ? 'Analysing...' : insights.length > 0 ? 'Regenerate' : 'Generate insights'}
          </button>
        </div>
      </div>

      {insights.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {insights.map((insight, i) => {
            const c = SEV[insight.severity] ?? SEV.info
            return (
              <div key={i} style={{ backgroundColor: c.bg, border: `0.5px solid ${c.border}`, borderRadius: '10px', padding: '14px 16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ color: c.dot, flexShrink: 0, marginTop: '1px' }}><InsightIcon type={insight.type} /></div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: c.text, marginBottom: '4px' }}>{insight.title}</p>
                  <p style={{ fontSize: '13px', color: '#333333', lineHeight: 1.6 }}>{insight.content}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
