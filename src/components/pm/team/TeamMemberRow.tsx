'use client'

import { useState } from 'react'
import type { TeamMember } from '@/hooks/useTeamMembers'

const ROLE_LABEL: Record<string, string> = {
  engineer: 'Site Engineer',
  pm: 'Project Manager',
  foreman: 'Foreman',
  qs: 'Quantity Surveyor',
  storekeeper: 'Storekeeper',
  owner: 'Owner',
}

const ROLES = [
  { value: 'engineer', label: 'Site Engineer' },
  { value: 'pm', label: 'Project Manager' },
  { value: 'foreman', label: 'Foreman' },
  { value: 'qs', label: 'Quantity Surveyor' },
  { value: 'storekeeper', label: 'Storekeeper' },
]

interface Props {
  member: TeamMember
  onRemove: () => Promise<void>
  onChangeRole: (role: string) => Promise<void>
}

export default function TeamMemberRow({ member, onRemove, onChangeRole }: Props) {
  const [mode, setMode] = useState<'default' | 'edit' | 'confirm-remove'>('default')
  const [newRole, setNewRole] = useState(member.role)
  const [saving, setSaving] = useState(false)

  async function handleChangeRole() {
    setSaving(true)
    await onChangeRole(newRole)
    setSaving(false)
    setMode('default')
  }

  async function handleRemove() {
    setSaving(true)
    await onRemove()
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-xl px-4 py-3 mb-2" style={{ border: '0.5px solid #EEEEEE' }}>
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: '#111111' }}>{member.fullName}</p>
          <p className="text-xs" style={{ color: '#BBBBBB' }}>{ROLE_LABEL[member.role] ?? member.role}</p>
        </div>
        {mode === 'default' && (
          <div className="flex gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setMode('edit')}
              className="text-xs font-medium px-2.5 py-1.5 rounded-lg"
              style={{ border: '1px solid #EEEEEE', color: '#666666' }}
            >
              Change role
            </button>
            <button
              type="button"
              onClick={() => setMode('confirm-remove')}
              className="text-xs font-medium px-2.5 py-1.5 rounded-lg"
              style={{ border: '1px solid #EEEEEE', color: '#E24B4A' }}
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {mode === 'edit' && (
        <div className="flex items-center gap-2 mt-3">
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="flex-1 px-2 py-2 text-sm rounded-lg outline-none"
            style={{ backgroundColor: '#F5F6FA', border: '1px solid #EEEEEE', color: '#111111' }}
          >
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <button
            type="button"
            onClick={handleChangeRole}
            disabled={saving}
            className="px-3 py-2 text-xs font-semibold text-white rounded-lg disabled:opacity-60"
            style={{ backgroundColor: '#00236F' }}
          >
            {saving ? '...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => setMode('default')}
            className="px-2 py-2 text-xs rounded-lg"
            style={{ color: '#666666' }}
          >
            Cancel
          </button>
        </div>
      )}

      {mode === 'confirm-remove' && (
        <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: '1px solid #EEEEEE' }}>
          <p className="text-xs" style={{ color: '#E24B4A' }}>Remove {member.fullName} from project?</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRemove}
              disabled={saving}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white disabled:opacity-60"
              style={{ backgroundColor: '#E24B4A' }}
            >
              {saving ? '...' : 'Remove'}
            </button>
            <button
              type="button"
              onClick={() => setMode('default')}
              className="text-xs px-2 py-1.5 rounded-lg"
              style={{ color: '#666666' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
