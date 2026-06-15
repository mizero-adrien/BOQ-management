'use client'

import { useState } from 'react'
import type { UserSearchResult as SearchResult } from '@/hooks/useUserSearch'

const ROLES = [
  { value: 'engineer', label: 'Site Engineer' },
  { value: 'pm', label: 'Project Manager' },
  { value: 'foreman', label: 'Foreman' },
  { value: 'qs', label: 'Quantity Surveyor' },
  { value: 'storekeeper', label: 'Storekeeper' },
]

const FIELD_STYLE = { backgroundColor: '#F5F6FA', border: '1px solid #EEEEEE', color: '#111111' }

interface Props {
  result: SearchResult
  added: boolean
  onAdd: (role: string) => Promise<boolean>
}

export default function UserSearchResult({ result, added, onAdd }: Props) {
  const [expanding, setExpanding] = useState(false)
  const [role, setRole] = useState(result.role || 'engineer')
  const [saving, setSaving] = useState(false)

  async function handleConfirm() {
    setSaving(true)
    await onAdd(role)
    setSaving(false)
    setExpanding(false)
  }

  if (added) {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ backgroundColor: '#F5F6FA' }}>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: '#111111' }}>{result.full_name}</p>
          <p className="text-xs" style={{ color: '#BBBBBB' }}>{result.email}</p>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: '#E4E9FA', color: '#00236F' }}>
          Added
        </span>
      </div>
    )
  }

  return (
    <div className="px-3 py-2.5 rounded-lg" style={{ border: '1px solid #EEEEEE' }}>
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: '#111111' }}>{result.full_name}</p>
          <p className="text-xs" style={{ color: '#666666' }}>{result.email}</p>
        </div>
        {!expanding && (
          <button
            type="button"
            onClick={() => setExpanding(true)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0"
            style={{ border: '1px solid #00236F', color: '#00236F' }}
          >
            Add
          </button>
        )}
      </div>
      {expanding && (
        <div className="flex items-center gap-2 mt-2">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="flex-1 px-2 py-2 text-sm rounded-lg outline-none"
            style={FIELD_STYLE}
          >
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving}
            className="px-3 py-2 text-xs font-semibold text-white rounded-lg disabled:opacity-60"
            style={{ backgroundColor: '#00236F' }}
          >
            {saving ? '...' : 'Confirm'}
          </button>
          <button
            type="button"
            onClick={() => setExpanding(false)}
            className="px-3 py-2 text-xs rounded-lg"
            style={{ color: '#666666' }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
