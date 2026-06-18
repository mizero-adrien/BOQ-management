'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useActiveProject } from '@/hooks/useActiveProject'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'

export default function ForemanLogPage() {
  const router = useRouter()
  const { project } = useActiveProject()
  const [workers, setWorkers] = useState(0)
  const [notes, setNotes] = useState('')
  const [issues, setIssues] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const FIELD = { backgroundColor: '#F5F6FA', border: '1px solid #EEEEEE', color: '#111111' }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!project) return
    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Session expired', 'Please sign in again'); setSubmitting(false); return }

    const todayStr = new Date().toISOString().slice(0, 10)
    const { error: err } = await supabase.from('daily_reports').upsert({
      project_id: project.id,
      engineer_id: user.id,
      report_date: todayStr,
      workers_count: workers,
      notes: notes.trim() || null,
      issues: issues.trim() || null,
      progress_pct: 0,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    }, { onConflict: 'project_id,engineer_id,report_date' })

    if (err) { toast.error('Failed to submit', 'Please try again'); setSubmitting(false); return }

    // Notify PM
    const { data: project_data } = await supabase.from('projects').select('pm_id').eq('id', project.id).single()
    if (project_data) {
      await supabase.from('notifications').insert({
        user_id: project_data.pm_id as string,
        project_id: project.id,
        type: 'report_submitted',
        title: 'Foreman crew report submitted',
        body: `${workers} workers on site today. ${issues ? 'Issues reported.' : 'No issues.'}`,
        read: false,
        action_url: `/pm/dashboard`,
      })
    }

    router.push('/foreman/dashboard')
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-8" style={{ maxWidth: '560px', margin: '0 auto' }}>
      <h1 className="text-xl font-semibold mb-1" style={{ color: '#111111' }}>Daily Crew Report</h1>
      <p className="text-sm mb-6" style={{ color: '#666666' }}>{project?.name ?? 'Loading...'}</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#111111' }}>Workers present today</label>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setWorkers((w) => Math.max(0, w - 1))}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-semibold"
              style={{ backgroundColor: '#F5F6FA', border: '1px solid #EEEEEE', color: '#111111' }}>−</button>
            <span className="text-3xl font-bold w-12 text-center" style={{ color: '#00236F' }}>{workers}</span>
            <button type="button" onClick={() => setWorkers((w) => w + 1)}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-semibold"
              style={{ backgroundColor: '#F5F6FA', border: '1px solid #EEEEEE', color: '#111111' }}>+</button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#111111' }}>Site notes</label>
          <textarea rows={3} placeholder="General site update..." value={notes} onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-3 text-sm rounded-lg outline-none resize-none" style={FIELD} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#111111' }}>Issues (if any)</label>
          <textarea rows={3} placeholder="Describe any issues on site..." value={issues} onChange={(e) => setIssues(e.target.value)}
            className="w-full px-4 py-3 text-sm rounded-lg outline-none resize-none" style={FIELD} />
        </div>
        <button type="submit" disabled={submitting || !project}
          className="w-full py-4 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
          style={{ backgroundColor: '#00236F' }}>
          {submitting ? 'Submitting...' : 'Submit crew report'}
        </button>
      </form>
    </div>
  )
}
