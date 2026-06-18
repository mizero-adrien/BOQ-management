'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'

export default function NewProjectPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [clientName, setClientName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const fieldStyle = {
    width: '100%',
    padding: '12px 14px',
    fontSize: '14px',
    borderRadius: '8px',
    border: '1px solid #EEEEEE',
    backgroundColor: '#F5F6FA',
    color: '#111111',
    outline: 'none',
    fontFamily: 'inherit' as const,
  }

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600' as const,
    color: '#111111',
    marginBottom: '6px',
  }

  async function handleSubmit() {
    if (!name.trim()) { toast.error('Missing field', 'Project name is required'); return }
    if (!location.trim()) { toast.error('Missing field', 'Location is required'); return }
    if (!clientName.trim()) { toast.error('Missing field', 'Client name is required'); return }
    if (!startDate) { toast.error('Missing field', 'Start date is required'); return }
    if (!endDate) { toast.error('Missing field', 'Expected end date is required'); return }

    setLoading(true)

    try {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Not authenticated', 'You must be logged in')
        setLoading(false)
        return
      }

      const { data: companyMembers, error: cmError } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)

      if (cmError || !companyMembers || companyMembers.length === 0) {
        console.error('Company member query:', cmError ?? 'No company members found for user ' + user.id)
        toast.error('Company not found', 'Could not find your company. Please refresh the page and try again.')
        setLoading(false)
        return
      }

      const companyMember = companyMembers[0]

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          company_id: companyMember.company_id,
          pm_id: user.id,
          name: name.trim(),
          location: location.trim(),
          client_name: clientName.trim(),
          start_date: startDate,
          expected_end_date: endDate,
          status: 'active',
          overall_progress: 0,
        })
        .select('id')
        .single()

      if (projectError || !project) {
        console.error('Project error:', projectError?.message)
        toast.error('Could not create project', projectError?.message ?? 'Unknown error')
        setLoading(false)
        return
      }

      await supabase.from('project_members').insert({
        project_id: project.id,
        user_id: user.id,
        role: 'pm',
      })

      toast.success('Project created', name.trim())
      router.push('/pm/projects/' + project.id)
    } catch (err) {
      console.error('Unexpected error:', err)
      toast.error('Unexpected error', 'An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{ backgroundColor: '#F5F6FA', minHeight: '100vh', padding: '32px 20px' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <Link
            href="/pm/projects"
            style={{ color: '#BBBBBB', textDecoration: 'none', fontSize: '20px', lineHeight: '1', display: 'flex', alignItems: 'center' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
            </svg>
          </Link>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111111' }}>
            New project
          </h1>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '0.5px solid #EEEEEE', padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Project name <span style={{ color: '#E24B4A' }}>*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Musanze Commercial Refurbishment"
              style={fieldStyle}
              onFocus={(e) => { e.target.style.border = '1.5px solid #00236F' }}
              onBlur={(e) => { e.target.style.border = '1px solid #EEEEEE' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Location <span style={{ color: '#E24B4A' }}>*</span></label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Gataraga Sector, Musanze District"
              style={fieldStyle}
              onFocus={(e) => { e.target.style.border = '1.5px solid #00236F' }}
              onBlur={(e) => { e.target.style.border = '1px solid #EEEEEE' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Client name <span style={{ color: '#E24B4A' }}>*</span></label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Mr. Habimana Jean"
              style={fieldStyle}
              onFocus={(e) => { e.target.style.border = '1.5px solid #00236F' }}
              onBlur={(e) => { e.target.style.border = '1px solid #EEEEEE' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Start date <span style={{ color: '#E24B4A' }}>*</span></label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={fieldStyle}
                onFocus={(e) => { e.target.style.border = '1.5px solid #00236F' }}
                onBlur={(e) => { e.target.style.border = '1px solid #EEEEEE' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Expected end date <span style={{ color: '#E24B4A' }}>*</span></label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={fieldStyle}
                onFocus={(e) => { e.target.style.border = '1.5px solid #00236F' }}
                onBlur={(e) => { e.target.style.border = '1px solid #EEEEEE' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>
              Description <span style={{ fontSize: '11px', fontWeight: '400', color: '#BBBBBB' }}>(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the project scope and objectives"
              rows={3}
              style={{ ...fieldStyle, resize: 'vertical', lineHeight: '1.5' }}
              onFocus={(e) => { e.target.style.border = '1.5px solid #00236F' }}
              onBlur={(e) => { e.target.style.border = '1px solid #EEEEEE' }}
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: loading ? '#BBBBBB' : '#00236F',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Creating project...' : 'Create project'}
          </button>
        </div>
      </div>
    </div>
  )
}
