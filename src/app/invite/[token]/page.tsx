'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface InvitationData {
  id: string
  email: string
  role: string
  accepted: boolean
  expires_at: string
  invited_by: string
  token: string
  company_id: string
  project_id: string
  project_name: string
  project_location: string
  inviter_name: string
}

// Typed shape of the raw invitations row (no joins)
interface RawInvitationRow {
  id: string
  email: string
  role: string
  accepted: boolean
  expires_at: string
  invited_by: string
  token: string
  company_id: string
  project_id: string
}

type PageState =
  | 'loading'
  | 'invalid'
  | 'expired'
  | 'already_accepted'
  | 'not_logged_in'
  | 'is_inviter'
  | 'accept'
  | 'success'

function formatRole(role: string): string {
  const map: Record<string, string> = {
    engineer: 'Site Engineer',
    pm: 'Project Manager',
    foreman: 'Foreman',
    qs: 'Quantity Surveyor',
    storekeeper: 'Storekeeper',
    owner: 'Owner / Client',
    pending: 'Team Member',
  }
  return map[role] ?? role
}

function getRedirectPath(role: string): string {
  const map: Record<string, string> = {
    pm: '/pm/dashboard',
    engineer: '/dashboard',
    foreman: '/foreman/dashboard',
    qs: '/qs/dashboard',
    storekeeper: '/storekeeper/dashboard',
    owner: '/dashboard',
  }
  return map[role] ?? '/dashboard'
}

const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#F5F6FA',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
}

const cardStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  border: '0.5px solid #EEEEEE',
  padding: '32px',
  maxWidth: '460px',
  width: '100%',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
}

const primaryBtnStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '14px',
  backgroundColor: '#00236F',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '10px',
  fontSize: '14px',
  fontWeight: '600',
  cursor: 'pointer',
  textAlign: 'center',
  textDecoration: 'none',
  marginBottom: '10px',
}

const outlineBtnStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '14px',
  backgroundColor: '#FFFFFF',
  color: '#00236F',
  border: '1.5px solid #00236F',
  borderRadius: '10px',
  fontSize: '14px',
  fontWeight: '600',
  cursor: 'pointer',
  textAlign: 'center',
  textDecoration: 'none',
  marginBottom: '10px',
}

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [pageState, setPageState] = useState<PageState>('loading')
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserName, setCurrentUserName] = useState<string>('')
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const supabase = createClient()

      // Use getSession() — reads localStorage, no mandatory network round-trip.
      // Wrapped in try-catch so a cold-start or network blip does not crash the page.
      let userId: string | null = null
      try {
        const { data: { session } } = await supabase.auth.getSession()
        userId = session?.user?.id ?? null
      } catch {
        userId = null
      }

      // Step 1 — fetch the invitation row (plain select, no joins to avoid PostgREST quirks)
      const { data: inv, error: invError } = await supabase
        .from('invitations')
        .select('id, email, role, accepted, expires_at, invited_by, token, company_id, project_id')
        .eq('token', token)
        .single()

      if (invError || !inv) {
        console.error('[invite] lookup failed:', invError?.code, invError?.message, '| token:', token)
        setPageState('invalid')
        return
      }

      const row = inv as RawInvitationRow

      // Step 2 — fetch project name/location (optional; use fallback if RLS blocks anon)
      let projectName = 'Construction Project'
      let projectLocation = ''
      try {
        const { data: proj } = await supabase
          .from('projects')
          .select('id, name, location')
          .eq('id', row.project_id)
          .single()
        if (proj) {
          projectName = (proj.name as string | null) ?? projectName
          projectLocation = (proj.location as string | null) ?? ''
        }
      } catch {
        // non-fatal — fallback values used
      }

      // Step 3 — fetch inviter display name (only works when authenticated or policy allows)
      let inviterName = 'Your project manager'
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', row.invited_by)
          .single()
        if (profile?.full_name) {
          inviterName = profile.full_name as string
        }
      } catch {
        // non-fatal — fallback used
      }

      const invitationData: InvitationData = {
        id: row.id,
        email: row.email,
        role: row.role,
        accepted: row.accepted,
        expires_at: row.expires_at,
        invited_by: row.invited_by,
        token: row.token,
        company_id: row.company_id,
        project_id: row.project_id,
        project_name: projectName,
        project_location: projectLocation,
        inviter_name: inviterName,
      }

      setInvitation(invitationData)

      if (row.accepted) {
        setPageState('already_accepted')
        return
      }

      if (new Date(row.expires_at) < new Date()) {
        setPageState('expired')
        return
      }

      if (!userId) {
        setPageState('not_logged_in')
        return
      }

      setCurrentUserId(userId)

      if (userId === row.invited_by) {
        // PM opened their own invite link — show warning with their name
        try {
          const { data: pmProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', userId)
            .single()
          setCurrentUserName((pmProfile?.full_name as string | undefined) ?? 'You')
        } catch {
          setCurrentUserName('You')
        }
        setPageState('is_inviter')
        return
      }

      setPageState('accept')
    }

    init()
  }, [token])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setCurrentUserId(null)
    setCurrentUserName('')
    setPageState('not_logged_in')
  }

  async function handleAccept() {
    if (!invitation || !currentUserId) return
    setAccepting(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error: pmError } = await supabase
        .from('project_members')
        .insert({
          project_id: invitation.project_id,
          user_id: currentUserId,
          role: invitation.role,
        })

      // 23505 = unique_violation (already a member) — treat as success
      if (pmError && pmError.code !== '23505') {
        setError('Could not add you to the project. Please try again.')
        setAccepting(false)
        return
      }

      await supabase.from('company_members').upsert({
        company_id: invitation.company_id,
        user_id: currentUserId,
        role: invitation.role,
      })

      await supabase
        .from('profiles')
        .update({ role: invitation.role })
        .eq('id', currentUserId)

      await supabase.auth.updateUser({
        data: { role: invitation.role, has_company: true },
      })

      await supabase
        .from('invitations')
        .update({ accepted: true })
        .eq('id', invitation.id)

      setPageState('success')
      setTimeout(() => {
        router.push(getRedirectPath(invitation.role))
      }, 2000)
    } catch (err) {
      console.error('Accept error:', err)
      setError('Something went wrong. Please try again.')
      setAccepting(false)
    }
  }

  function InvitationHeader() {
    if (!invitation) return null
    return (
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#E4E9FA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00236F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#111111', marginBottom: '8px', lineHeight: '1.3' }}>
          You have been invited to join
        </h1>
        <div style={{ backgroundColor: '#E4E9FA', borderRadius: '10px', padding: '14px 16px', marginBottom: '12px', textAlign: 'left' }}>
          <p style={{ fontSize: '16px', fontWeight: '600', color: '#00236F', marginBottom: '2px' }}>
            {invitation.project_name}
          </p>
          {invitation.project_location && (
            <p style={{ fontSize: '13px', color: '#778EDE' }}>{invitation.project_location}</p>
          )}
        </div>
        <p style={{ fontSize: '14px', color: '#666666', lineHeight: '1.6' }}>
          <strong style={{ color: '#111111' }}>{invitation.inviter_name}</strong> has invited you as{' '}
          <span style={{ fontWeight: '600', color: '#00236F', backgroundColor: '#E4E9FA', padding: '2px 8px', borderRadius: '20px', fontSize: '13px' }}>
            {formatRole(invitation.role)}
          </span>
        </p>
      </div>
    )
  }

  if (pageState === 'loading') {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #EEEEEE', borderTopColor: '#00236F', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ fontSize: '14px', color: '#666666' }}>Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (pageState === 'invalid') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#FFF5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: '600', color: '#111111', marginBottom: '8px' }}>Invalid invitation</h1>
            <p style={{ fontSize: '14px', color: '#666666', lineHeight: '1.6', marginBottom: '20px' }}>
              This invitation link is invalid or does not exist. Contact your project manager for a new link.
            </p>
            <Link href="/login" style={{ ...primaryBtnStyle, display: 'inline-block', width: 'auto', padding: '12px 24px' }}>
              Go to sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (pageState === 'expired') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <InvitationHeader />
          <div style={{ backgroundColor: '#FFF5F5', border: '1px solid #E24B4A', borderRadius: '10px', padding: '14px 16px', marginBottom: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#E24B4A', marginBottom: '4px' }}>This invitation has expired</p>
            <p style={{ fontSize: '13px', color: '#E24B4A' }}>Invitation links expire after 7 days. Ask your project manager to send a new one.</p>
          </div>
          <Link href="/login" style={{ ...outlineBtnStyle, marginBottom: '0' }}>Go to sign in</Link>
        </div>
      </div>
    )
  }

  if (pageState === 'already_accepted') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#E4E9FA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00236F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: '600', color: '#111111', marginBottom: '8px' }}>Already accepted</h1>
            <p style={{ fontSize: '14px', color: '#666666', marginBottom: '20px' }}>
              This invitation has already been used. Sign in to access your dashboard.
            </p>
            <Link href="/login" style={primaryBtnStyle}>Sign in to your account</Link>
          </div>
        </div>
      </div>
    )
  }

  if (pageState === 'not_logged_in') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <InvitationHeader />
          <div style={{ borderTop: '0.5px solid #EEEEEE', paddingTop: '20px' }}>
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#BBBBBB', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px', textAlign: 'center' }}>
              Choose how to join
            </p>
            <Link href={`/signup?invite=${token}`} style={primaryBtnStyle}>
              Create a new account
            </Link>
            <Link href={`/login?invite=${token}`} style={outlineBtnStyle}>
              Sign in to existing account
            </Link>
            <p style={{ fontSize: '11px', color: '#BBBBBB', textAlign: 'center', marginTop: '8px' }}>
              By joining you agree to the terms of use of this platform
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (pageState === 'is_inviter') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <InvitationHeader />
          <div style={{ backgroundColor: '#FAEEDA', border: '1px solid #EF9F27', borderRadius: '10px', padding: '14px 16px', marginBottom: '20px' }}>
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#854F0B', marginBottom: '4px' }}>
              You are signed in as {currentUserName}
            </p>
            <p style={{ fontSize: '13px', color: '#854F0B' }}>
              You created this invitation. To accept it as a different person sign out first, then open this link again.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            style={primaryBtnStyle}
          >
            Sign out and continue
          </button>
          <Link href="/pm/dashboard" style={{ display: 'block', textAlign: 'center', fontSize: '13px', color: '#666666', textDecoration: 'none', marginTop: '4px' }}>
            Back to my dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (pageState === 'accept') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <InvitationHeader />
          {error && (
            <div style={{ backgroundColor: '#FFF5F5', border: '1px solid #E24B4A', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '13px', color: '#E24B4A' }}>
              {error}
            </div>
          )}
          <div style={{ borderTop: '0.5px solid #EEEEEE', paddingTop: '20px' }}>
            <button
              type="button"
              onClick={handleAccept}
              disabled={accepting}
              style={{ ...primaryBtnStyle, backgroundColor: accepting ? '#BBBBBB' : '#00236F', cursor: accepting ? 'not-allowed' : 'pointer', marginBottom: '0' }}
            >
              {accepting ? 'Joining project...' : 'Accept invitation and join'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (pageState === 'success') {
    return (
      <div style={containerStyle}>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#E4E9FA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00236F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#111111', marginBottom: '8px' }}>
            Welcome to the team
          </h1>
          <p style={{ fontSize: '14px', color: '#666666', lineHeight: '1.6' }}>
            You have joined <strong style={{ color: '#111111' }}>{invitation?.project_name}</strong> as{' '}
            <strong style={{ color: '#00236F' }}>{formatRole(invitation?.role ?? '')}</strong>.
          </p>
          <p style={{ fontSize: '13px', color: '#BBBBBB', marginTop: '8px' }}>
            Taking you to your dashboard...
          </p>
        </div>
      </div>
    )
  }

  return null
}
