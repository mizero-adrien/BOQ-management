'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import type { Profile } from '@/types/database'
import { toast } from '@/lib/toast'

const ROLE_LABELS: Record<string, string> = {
  engineer: 'Site Engineer', pm: 'Project Manager', foreman: 'Foreman',
  qs: 'Quantity Surveyor', storekeeper: 'Storekeeper', owner: 'Owner',
}

interface ProjectInfo {
  projectName: string | null
  companyName: string | null
  projectRole: string | null
}

function Row({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3.5"
      style={{ borderBottom: last ? 'none' : '1px solid #EEEEEE' }}
    >
      <p style={{ fontSize: '13px', color: '#666666' }}>{label}</p>
      <div className="ml-3 text-right">{children}</div>
    </div>
  )
}

export default function ProfileDetailsCard({
  profile,
  email,
  projectInfo,
  onNameUpdated,
}: {
  profile: Profile
  email: string
  projectInfo: ProjectInfo
  onNameUpdated: (name: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(profile.full_name)
  const [saving, setSaving] = useState(false)

  async function saveName() {
    if (!name.trim() || saving) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('profiles').update({ full_name: name.trim() }).eq('id', profile.id)
    await supabase.auth.updateUser({ data: { full_name: name.trim() } })
    onNameUpdated(name.trim())
    toast.success('Name updated')
    setSaving(false)
    setEditing(false)
  }

  const roleDisplay = ROLE_LABELS[profile.role] ?? profile.role.replace(/_/g, ' ')

  return (
    <div className="mb-5">
      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#BBBBBB' }}>
        Account details
      </p>
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #EEEEEE' }}>
        <Row label="Full name">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditing(false) }}
                autoFocus
                className="px-2 py-1 text-sm rounded outline-none"
                style={{ border: '1px solid #00236F', color: '#111111', width: '140px' }}
              />
              <button type="button" onClick={saveName} disabled={saving}
                className="text-xs font-semibold disabled:opacity-50" style={{ color: '#00236F' }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button type="button" onClick={() => setEditing(false)}
                className="text-xs" style={{ color: '#666666' }}>Cancel</button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <p style={{ fontSize: '13px', fontWeight: 500, color: '#111111' }}>{profile.full_name}</p>
              <button type="button" onClick={() => setEditing(true)}
                className="text-xs font-medium" style={{ color: '#00236F' }}>Edit</button>
            </div>
          )}
        </Row>
        <Row label="Email">
          <p style={{ fontSize: '13px', fontWeight: 500, color: '#111111' }}>{email}</p>
        </Row>
        <Row label="System role">
          <p style={{ fontSize: '13px', fontWeight: 500, color: '#111111' }}>{roleDisplay}</p>
          <p style={{ fontSize: '11px', color: '#BBBBBB' }}>Controls your dashboard and access</p>
        </Row>
        <Row label="Member since" last>
          <p style={{ fontSize: '13px', fontWeight: 500, color: '#111111' }}>{formatDate(profile.created_at)}</p>
        </Row>
      </div>

      <p className="text-xs font-semibold uppercase tracking-wider mt-5 mb-2" style={{ color: '#BBBBBB' }}>
        Current project
      </p>
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #EEEEEE' }}>
        <Row label="Project">
          <p style={{ fontSize: '13px', fontWeight: 500, color: projectInfo.projectName ? '#111111' : '#BBBBBB' }}>
            {projectInfo.projectName ?? 'Not assigned to any project'}
          </p>
        </Row>
        <Row label="Company">
          <p style={{ fontSize: '13px', fontWeight: 500, color: '#111111' }}>{projectInfo.companyName ?? '—'}</p>
        </Row>
        <Row label="Role on project" last>
          <p style={{ fontSize: '13px', fontWeight: 500, color: '#111111' }}>
            {projectInfo.projectRole ? (ROLE_LABELS[projectInfo.projectRole] ?? projectInfo.projectRole) : '—'}
          </p>
          <p style={{ fontSize: '11px', color: '#BBBBBB' }}>Your role on this specific project</p>
        </Row>
      </div>
      <p className="mt-2 px-1" style={{ fontSize: '11px', color: '#BBBBBB', lineHeight: '1.5' }}>
        Your role on a project may differ from your system role. Contact your project manager if this seems incorrect.
      </p>
    </div>
  )
}
