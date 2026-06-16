'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import InviteSuccessPanel from './InviteSuccessPanel'
import type { Project } from '@/types/database'

interface Props {
  projects: Project[]
  currentUserId: string
  currentUserName: string
}

interface SuccessResult {
  inviteLink: string
  message: string
  projectName: string
  inviteeEmail: string
  role: string
}

function formatRole(role: string): string {
  const map: Record<string, string> = {
    engineer: 'Site Engineer',
    pm: 'Project Manager',
    foreman: 'Foreman',
    qs: 'Quantity Surveyor',
    storekeeper: 'Storekeeper',
    owner: 'Owner / Client',
  }
  return map[role] ?? role
}

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  fontSize: '14px',
  borderRadius: '8px',
  border: '1px solid #EEEEEE',
  backgroundColor: '#F5F6FA',
  color: '#111111',
  outline: 'none',
}

export default function InviteByLinkTab({ projects, currentUserId, currentUserName }: Props) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('engineer')
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SuccessResult | null>(null)

  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? projects[0]

  async function handleCreate() {
    setError(null)

    if (!email.trim()) { setError('Please enter an email address'); return }
    if (!email.includes('@')) { setError('Please enter a valid email address'); return }
    if (!selectedProjectId) { setError('Please select a project'); return }

    setLoading(true)

    try {
      const supabase = createClient()

      const { data: companyMember, error: cmError } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', currentUserId)
        .single()

      if (cmError || !companyMember) {
        setError('Could not find your company. Please refresh and try again.')
        setLoading(false)
        return
      }

      const { data: invitation, error: inviteError } = await supabase
        .from('invitations')
        .insert({
          email: email.trim().toLowerCase(),
          role,
          project_id: selectedProjectId,
          company_id: companyMember.company_id,
          invited_by: currentUserId,
        })
        .select('token')
        .single()

      if (inviteError || !invitation) {
        setError('Could not create invitation: ' + (inviteError?.message ?? 'Unknown error'))
        setLoading(false)
        return
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
      const inviteLink = baseUrl + '/invite/' + (invitation.token as string)
      const roleLabel = formatRole(role)
      const projectName = selectedProject?.name ?? 'the project'
      const projectLocation = (selectedProject as Project & { location?: string })?.location ?? ''

      const locationPart = projectLocation ? ' located at ' + projectLocation : ''
      const message = 'Hello,\n\n'
        + 'You have been invited to join ' + projectName + locationPart + ' as ' + roleLabel + '.\n\n'
        + currentUserName + ' has added you to their construction project management platform.\n\n'
        + 'Click the link below to accept your invitation and create your account:\n\n'
        + inviteLink + '\n\n'
        + 'This link expires in 7 days.'

      setResult({
        inviteLink,
        message,
        projectName,
        inviteeEmail: email.trim().toLowerCase(),
        role,
      })
      setEmail('')
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <InviteSuccessPanel
        inviteLink={result.inviteLink}
        message={result.message}
        projectName={result.projectName}
        inviteeEmail={result.inviteeEmail}
        role={result.role}
        onCreateAnother={() => setResult(null)}
      />
    )
  }

  return (
    <div style={{ maxWidth: '480px' }}>
      {error && (
        <div style={{ backgroundColor: '#FFF5F5', border: '1px solid #E24B4A', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px', fontSize: '13px', color: '#E24B4A' }}>
          {error}
        </div>
      )}

      {/* Project selector — always first, always required */}
      <div style={{ marginBottom: '14px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#111111', marginBottom: '6px' }}>
          Select project to invite to
        </label>
        {projects.length === 1 ? (
          <div style={{ backgroundColor: '#E4E9FA', borderRadius: '8px', padding: '10px 12px' }}>
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#00236F', marginBottom: '1px' }}>{selectedProject?.name}</p>
            {(selectedProject as Project & { location?: string })?.location && (
              <p style={{ fontSize: '12px', color: '#778EDE' }}>{(selectedProject as Project & { location?: string }).location}</p>
            )}
          </div>
        ) : (
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            style={fieldStyle}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
      </div>

      <div style={{ marginBottom: '14px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#111111', marginBottom: '6px' }}>
          Email address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="colleague@email.com"
          onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
          style={fieldStyle}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#111111', marginBottom: '6px' }}>
          Role
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={fieldStyle}
        >
          <option value="engineer">Site Engineer</option>
          <option value="pm">Project Manager</option>
          <option value="foreman">Foreman</option>
          <option value="qs">Quantity Surveyor</option>
          <option value="storekeeper">Storekeeper</option>
          <option value="owner">Owner / Client</option>
        </select>
      </div>

      <button
        type="button"
        onClick={handleCreate}
        disabled={loading}
        style={{ width: '100%', padding: '14px', backgroundColor: loading ? '#BBBBBB' : '#00236F', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer' }}
      >
        {loading ? 'Creating...' : 'Create invite link'}
      </button>
    </div>
  )
}
