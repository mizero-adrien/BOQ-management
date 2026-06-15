'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const FIELD_STYLE = {
  backgroundColor: '#F5F6FA',
  border: '1px solid #EEEEEE',
  color: '#111111',
}

interface ProjectStepProps {
  companyId: string
  onComplete: (projectId: string) => void
}

export default function ProjectStep({ companyId, onComplete }: ProjectStepProps) {
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [clientName, setClientName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleNext(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Session expired.')
      setSubmitting(false)
      return
    }

    const shareToken = crypto.randomUUID()
    const { data: project, error: projectErr } = await supabase
      .from('projects')
      .insert({
        company_id: companyId,
        pm_id: user.id,
        name: name.trim(),
        location: location.trim(),
        client_name: clientName.trim(),
        start_date: startDate,
        expected_end_date: endDate,
        status: 'active',
        share_token: shareToken,
        overall_progress: 0,
      })
      .select()
      .single()

    if (projectErr || !project) {
      setError('Failed to create project. Please try again.')
      setSubmitting(false)
      return
    }

    await supabase
      .from('project_members')
      .insert({ project_id: project.id, user_id: user.id, role: 'pm' })

    // Mark onboarding complete — new JWT will carry has_company: true for middleware
    await supabase.auth.updateUser({
      data: { has_company: true, role: 'pm' },
    })
    await supabase.auth.refreshSession()

    setSubmitting(false)
    onComplete(project.id as string)
  }

  return (
    <div
      className="bg-white rounded-2xl p-6"
      style={{ border: '0.5px solid #EEEEEE' }}
    >
      <h1 className="font-semibold mb-1" style={{ color: '#111111', fontSize: '22px' }}>
        Create your first project
      </h1>
      <p className="text-sm mb-6" style={{ color: '#666666' }}>
        You can add more projects later from your dashboard
      </p>

      {error && (
        <div
          className="mb-4 px-4 py-3 rounded-lg text-sm"
          style={{ backgroundColor: '#FFF5F5', color: '#E24B4A' }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleNext} className="flex flex-col gap-4">
        <Field label="Project name">
          <input type="text" placeholder="e.g. Musanze Refurbishment" value={name}
            onChange={(e) => setName(e.target.value)} required
            className="w-full px-4 py-3 text-sm rounded-lg outline-none" style={FIELD_STYLE} />
        </Field>
        <Field label="Location">
          <input type="text" placeholder="e.g. Gataraga, Musanze" value={location}
            onChange={(e) => setLocation(e.target.value)} required
            className="w-full px-4 py-3 text-sm rounded-lg outline-none" style={FIELD_STYLE} />
        </Field>
        <Field label="Client name">
          <input type="text" placeholder="e.g. Mr. Habimana Jean" value={clientName}
            onChange={(e) => setClientName(e.target.value)} required
            className="w-full px-4 py-3 text-sm rounded-lg outline-none" style={FIELD_STYLE} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              required className="w-full px-4 py-3 text-sm rounded-lg outline-none" style={FIELD_STYLE} />
          </Field>
          <Field label="End date">
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              required className="w-full px-4 py-3 text-sm rounded-lg outline-none" style={FIELD_STYLE} />
          </Field>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 rounded-xl text-sm font-semibold text-white mt-2 disabled:opacity-60"
          style={{ backgroundColor: '#00236F' }}
        >
          {submitting ? 'Creating...' : 'Next'}
        </button>
      </form>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: '#111111' }}>
        {label}
      </label>
      {children}
    </div>
  )
}
