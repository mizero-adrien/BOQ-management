'use client'

import { useState } from 'react'
import type { ProjectDetail } from '@/hooks/useProjectDetail'
import type { Project, ProjectStatus } from '@/types/database'
import { formatDate } from '@/lib/utils'

interface Props {
  project: ProjectDetail
  onUpdate: (updates: Partial<Pick<Project, 'name' | 'location' | 'client_name' | 'start_date' | 'expected_end_date' | 'status' | 'overall_progress' | 'plan_image_url'>>) => Promise<void>
}

const STATUS_OPTS: { value: ProjectStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3">
      <p className="uppercase tracking-wider mb-0.5" style={{ color: '#BBBBBB', fontSize: '11px', fontWeight: 600 }}>{label}</p>
      <p className="text-sm" style={{ color: '#111111' }}>{value}</p>
    </div>
  )
}

export default function ProjectInfoCard({ project, onUpdate }: Props) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: project.name, location: project.location, client_name: project.client_name,
    start_date: project.start_date, expected_end_date: project.expected_end_date, status: project.status,
  })

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))
  }

  async function handleSave() {
    setSaving(true)
    await onUpdate({ ...form, status: form.status as ProjectStatus })
    setSaving(false)
    setEditing(false)
  }

  const inputStyle = { backgroundColor: '#F5F6FA', border: '1px solid #EEEEEE', color: '#111111' }

  return (
    <div className="bg-white rounded-xl p-5 mb-4" style={{ border: '1px solid #EEEEEE' }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold" style={{ color: '#111111' }}>Project details</p>
        {!editing ? (
          <button type="button" onClick={() => setEditing(true)} className="text-xs px-3 py-1.5 rounded-lg"
            style={{ border: '1px solid #00236F', color: '#00236F' }}>Edit</button>
        ) : (
          <div className="flex gap-2">
            <button type="button" onClick={handleSave} disabled={saving}
              className="text-xs px-3 py-1.5 rounded-lg text-white disabled:opacity-50"
              style={{ backgroundColor: '#00236F' }}>{saving ? 'Saving...' : 'Save'}</button>
            <button type="button" onClick={() => setEditing(false)}
              className="text-xs px-3 py-1.5 rounded-lg" style={{ color: '#666666' }}>Cancel</button>
          </div>
        )}
      </div>
      {!editing ? (
        <>
          <InfoRow label="Name" value={project.name} />
          <InfoRow label="Location" value={project.location} />
          <InfoRow label="Client" value={project.client_name} />
          <InfoRow label="Start date" value={formatDate(project.start_date)} />
          <InfoRow label="End date" value={formatDate(project.expected_end_date)} />
          <InfoRow label="Status" value={project.status.replace('_', ' ')} />
        </>
      ) : (
        <div className="flex flex-col gap-2.5">
          {(['name', 'location', 'client_name'] as const).map((k) => (
            <input key={k} value={form[k]} onChange={set(k)} placeholder={k.replace('_', ' ')}
              className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
          ))}
          {(['start_date', 'expected_end_date'] as const).map((k) => (
            <input key={k} type="date" value={form[k]} onChange={set(k)}
              className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
          ))}
          <select value={form.status} onChange={set('status')}
            className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle}>
            {STATUS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      )}
    </div>
  )
}
