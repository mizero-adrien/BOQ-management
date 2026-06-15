'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import InviteSuccessState from './InviteSuccessState'

const ROLES = [
  { value: 'engineer', label: 'Site Engineer' },
  { value: 'pm', label: 'Project Manager' },
  { value: 'foreman', label: 'Foreman' },
  { value: 'qs', label: 'Quantity Surveyor' },
  { value: 'storekeeper', label: 'Storekeeper' },
]

const FIELD_STYLE = { backgroundColor: '#F5F6FA', border: '1px solid #EEEEEE', color: '#111111' }

interface InviteRow { email: string; role: string }
interface InviteStepProps { companyId: string; projectId: string; demoLoaded?: boolean }
interface CreatedInvite { email: string; token: string; role: string }

export default function InviteStep({ companyId, projectId, demoLoaded }: InviteStepProps) {
  const [rows, setRows] = useState<InviteRow[]>([{ email: '', role: 'engineer' }])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invitesCreated, setInvitesCreated] = useState<CreatedInvite[]>([])

  function updateRow(i: number, field: keyof InviteRow, value: string) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)))
  }

  function addRow() { setRows((prev) => [...prev, { email: '', role: 'engineer' }]) }
  function removeRow(i: number) { setRows((prev) => prev.filter((_, idx) => idx !== i)) }

  async function handleFinish() {
    setSubmitting(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Session expired.'); setSubmitting(false); return }

    const valid = rows.filter((r) => r.email.trim().includes('@'))
    if (valid.length === 0) { window.location.href = '/pm/dashboard'; return }

    const { data: created, error: inviteErr } = await supabase
      .from('invitations')
      .insert(valid.map((r) => ({
        project_id: projectId,
        company_id: companyId,
        invited_by: user.id,
        email: r.email.trim(),
        role: r.role,
      })))
      .select('token, email, role')

    setSubmitting(false)

    if (inviteErr || !created) {
      setError('Some invitations could not be created. You can invite from the team page later.')
      setTimeout(() => { window.location.href = '/pm/dashboard' }, 3000)
      return
    }

    setInvitesCreated(created as CreatedInvite[])
  }

  if (invitesCreated.length > 0) {
    return <InviteSuccessState invites={invitesCreated} projectId={projectId} />
  }

  return (
    <div className="bg-white rounded-2xl p-6" style={{ border: '0.5px solid #EEEEEE' }}>
      {demoLoaded && (
        <div className="mb-4 px-4 py-3 rounded-xl" style={{ backgroundColor: '#E4E9FA', border: '1px solid #C8D4F8' }}>
          <p className="text-sm font-semibold" style={{ color: '#00236F' }}>
            Demo project loaded — you can explore all features now.
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#00236F' }}>
            Your demo project includes sample BOQ data, daily reports, and tasks so you can explore all features immediately.
          </p>
        </div>
      )}
      <h1 className="font-semibold mb-1" style={{ color: '#111111', fontSize: '22px' }}>
        Invite your team
      </h1>
      <p className="text-sm mb-6" style={{ color: '#666666' }}>
        Add people who will work on this project. You will get shareable invite links.
      </p>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: '#FFF5F5', color: '#E24B4A' }}>
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2 mb-4">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="email"
              placeholder="colleague@email.com"
              value={row.email}
              onChange={(e) => updateRow(i, 'email', e.target.value)}
              className="flex-1 px-3 py-2.5 text-sm rounded-lg outline-none"
              style={FIELD_STYLE}
            />
            <select
              value={row.role}
              onChange={(e) => updateRow(i, 'role', e.target.value)}
              className="px-3 py-2.5 text-sm rounded-lg outline-none"
              style={{ ...FIELD_STYLE, width: '150px' }}
            >
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            {rows.length > 1 && (
              <button type="button" onClick={() => removeRow(i)} aria-label="Remove" style={{ color: '#BBBBBB' }}>
                <XIcon />
              </button>
            )}
          </div>
        ))}
      </div>

      <button type="button" onClick={addRow} className="flex items-center gap-1.5 text-sm mb-6" style={{ color: '#00236F' }}>
        <PlusIcon /> Add another person
      </button>

      <button
        type="button"
        onClick={handleFinish}
        disabled={submitting}
        className="w-full py-3.5 rounded-xl text-sm font-semibold text-white mb-3 disabled:opacity-60"
        style={{ backgroundColor: '#00236F' }}
      >
        {submitting ? 'Creating invites...' : 'Finish and invite'}
      </button>

      <button
        type="button"
        onClick={() => { window.location.href = '/pm/dashboard' }}
        className="w-full text-center text-sm py-1"
        style={{ color: '#BBBBBB' }}
      >
        Skip for now
      </button>
    </div>
  )
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
