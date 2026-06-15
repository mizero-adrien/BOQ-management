'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Project } from '@/types/database'
import InviteSharePanel from '@/components/shared/InviteSharePanel'
import { generateInviteMessage } from '@/lib/utils/inviteMessage'

const FIELD_STYLE = { backgroundColor: '#F5F6FA', border: '1px solid #EEEEEE', color: '#111111' }

interface InviteFormProps {
  projects: Project[]
  defaultProjectId?: string
}

export default function InviteForm({ projects, defaultProjectId }: InviteFormProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('engineer')
  const [projectId, setProjectId] = useState(defaultProjectId || projects[0]?.id || '')
  const [submitting, setSubmitting] = useState(false)
  const [inviteData, setInviteData] = useState<{ link: string; message: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId && (defaultProjectId || projects[0]?.id)) {
      setProjectId(defaultProjectId || projects[0]?.id || '')
    }
  }, [defaultProjectId, projects, projectId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !projectId) return
    setSubmitting(true)
    setError(null)
    setInviteData(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('Session expired. Please refresh.')
        setSubmitting(false)
        return
      }

      const [{ data: proj }, { data: pmProfile }] = await Promise.all([
        supabase.from('projects').select('company_id, name').eq('id', projectId).single(),
        supabase.from('profiles').select('full_name').eq('id', user.id).single(),
      ])

      if (!proj) {
        setError('Could not find project.')
        setSubmitting(false)
        return
      }

      const { data: inv, error: inviteErr } = await supabase
        .from('invitations')
        .insert({
          project_id: projectId,
          company_id: proj.company_id as string,
          invited_by: user.id,
          email: email.trim(),
          role,
        })
        .select('token')
        .single()

      if (inviteErr || !inv) {
        setError('Failed to create invitation. Try again.')
        setSubmitting(false)
        return
      }

      const link = `${window.location.origin}/invite/${inv.token as string}`
      const message = generateInviteMessage(
        null,
        (proj.name as string) ?? 'your project',
        role,
        pmProfile?.full_name ?? 'Your project manager',
        link
      )
      setEmail('')
      setInviteData({ link, message })
      setSubmitting(false)
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-4 mb-6" style={{ border: '0.5px solid #EEEEEE' }}>
      <p className="text-sm font-semibold mb-3" style={{ color: '#111111' }}>Invite by link</p>
      {error && <p className="text-xs mb-2" style={{ color: '#E24B4A' }}>{error}</p>}
      <div className="flex flex-col md:flex-row gap-2 mb-3">
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1 px-3 py-2.5 text-sm rounded-lg outline-none"
          style={FIELD_STYLE}
        />
        <select value={role} onChange={(e) => setRole(e.target.value)}
          className="px-3 py-2.5 text-sm rounded-lg outline-none" style={FIELD_STYLE}>
          <option value="engineer">Site Engineer</option>
          <option value="pm">Project Manager</option>
          <option value="foreman">Foreman</option>
          <option value="qs">Quantity Surveyor</option>
          <option value="storekeeper">Storekeeper</option>
        </select>
        {projects.length > 1 && (
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)}
            className="px-3 py-2.5 text-sm rounded-lg outline-none" style={FIELD_STYLE}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-60 mb-3"
        style={{ backgroundColor: '#00236F' }}
      >
        {submitting ? 'Creating...' : 'Create invite link'}
      </button>
      {inviteData && (
        <InviteSharePanel
          link={inviteData.link}
          message={inviteData.message}
          onClose={() => setInviteData(null)}
        />
      )}
    </form>
  )
}
