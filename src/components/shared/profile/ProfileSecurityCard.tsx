'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'

const INPUT_STYLE = {
  backgroundColor: '#F5F6FA',
  border: '1px solid #EEEEEE',
  color: '#111111',
} as const

export default function ProfileSecurityCard() {
  const [expanded, setExpanded] = useState(false)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<{ next?: string; confirm?: string; submit?: string }>({})
  const [saving, setSaving] = useState(false)

  function validate(): boolean {
    const e: typeof errors = {}
    if (next.length < 8) e.next = 'New password must be at least 8 characters'
    if (next !== confirm) e.confirm = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit() {
    if (!validate() || saving) return
    setSaving(true)
    setErrors({})
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: next })
    setSaving(false)
    if (error) {
      setErrors({ submit: error.message })
      toast.error('Update failed', error.message)
      return
    }
    toast.success('Password updated successfully')
    setCurrent(''); setNext(''); setConfirm('')
    setExpanded(false)
  }

  return (
    <div className="mb-5">
      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#BBBBBB' }}>
        Security
      </p>
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #EEEEEE' }}>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3.5"
        >
          <p style={{ fontSize: '13px', color: '#111111' }}>Change password</p>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#BBBBBB" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {expanded && (
          <div className="px-4 pb-4 border-t" style={{ borderColor: '#EEEEEE' }}>
            <div className="flex flex-col gap-2 mt-3">
              <input
                type="password"
                placeholder="Current password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg outline-none"
                style={INPUT_STYLE}
              />
              <div>
                <input
                  type="password"
                  placeholder="New password (min 8 characters)"
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg outline-none"
                  style={INPUT_STYLE}
                />
                {errors.next && <p className="text-xs mt-1" style={{ color: '#E24B4A' }}>{errors.next}</p>}
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg outline-none"
                  style={INPUT_STYLE}
                />
                {errors.confirm && <p className="text-xs mt-1" style={{ color: '#E24B4A' }}>{errors.confirm}</p>}
              </div>
              {errors.submit && <p className="text-xs" style={{ color: '#E24B4A' }}>{errors.submit}</p>}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="w-full py-2.5 text-sm font-semibold text-white rounded-lg mt-1 disabled:opacity-50"
                style={{ backgroundColor: '#00236F' }}
              >
                {saving ? 'Updating...' : 'Update password'}
              </button>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="text-sm text-center py-1"
                style={{ color: '#666666' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
