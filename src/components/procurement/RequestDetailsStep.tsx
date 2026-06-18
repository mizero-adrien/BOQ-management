'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Project { id: string; name: string }

export interface RequestDetails {
  title: string
  projectId: string
  requiredByDate: string
  description: string
}

interface Props {
  details: RequestDetails
  onChange: (d: RequestDetails) => void
  onNext: () => void
}

const F: React.CSSProperties = {
  width: '100%', padding: '12px', fontSize: '14px', borderRadius: '8px',
  border: '1px solid #EEEEEE', backgroundColor: '#F5F6FA', color: '#111111', outline: 'none',
}

const L: React.CSSProperties = {
  display: 'block', fontSize: '13px', fontWeight: 600, color: '#111111', marginBottom: '6px',
}

export default function RequestDetailsStep({ details, onChange, onNext }: Props) {
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: memberships } = await supabase
        .from('project_members').select('project_id').eq('user_id', user.id)
      const { data: owned } = await supabase
        .from('projects').select('id').eq('pm_id', user.id)
      const ids = [...new Set([
        ...(memberships ?? []).map((m: { project_id: string }) => m.project_id),
        ...(owned ?? []).map((p: { id: string }) => p.id),
      ])]
      if (ids.length === 0) return
      const { data } = await supabase.from('projects').select('id, name').in('id', ids).order('name')
      setProjects((data ?? []) as Project[])
    }
    load()
  }, [])

  function set<K extends keyof RequestDetails>(k: K, v: RequestDetails[K]) {
    onChange({ ...details, [k]: v })
  }

  function handleNext() {
    if (!details.title.trim() || !details.projectId || !details.requiredByDate) return
    onNext()
  }

  return (
    <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #EEEEEE' }}>
      <div style={{ marginBottom: '16px' }}>
        <label style={L}>Request title <span style={{ color: '#E24B4A' }}>*</span></label>
        <input value={details.title} onChange={(e) => set('title', e.target.value)}
          placeholder="e.g. Cement and rebar for phase 2" style={F} />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={L}>Project <span style={{ color: '#E24B4A' }}>*</span></label>
        <select value={details.projectId} onChange={(e) => set('projectId', e.target.value)} style={F}>
          <option value="">Select project</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={L}>Required by date <span style={{ color: '#E24B4A' }}>*</span></label>
        <input type="date" value={details.requiredByDate}
          onChange={(e) => set('requiredByDate', e.target.value)} style={F} />
      </div>
      <div style={{ marginBottom: '24px' }}>
        <label style={L}>Description</label>
        <textarea value={details.description} onChange={(e) => set('description', e.target.value)}
          rows={3} placeholder="Add context or special instructions"
          style={{ ...F, resize: 'none' as const, lineHeight: '1.5' }} />
      </div>
      <button
        type="button"
        onClick={handleNext}
        disabled={!details.title.trim() || !details.projectId || !details.requiredByDate}
        style={{ width: '100%', padding: '14px', backgroundColor: '#00236F', color: '#FFFFFF',
          border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
        className="disabled:opacity-40"
      >
        Next: Add items
      </button>
    </div>
  )
}
