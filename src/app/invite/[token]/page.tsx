'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { UserRole } from '@/types/database'
import { getRedirectPath } from '@/lib/utils/getRedirectPath'

interface Invite {
  id: string
  project_id: string
  company_id: string
  email: string
  role: string
  invited_by: string
  projectName: string
  inviterName: string
}

const ROLE_LABEL: Record<string, string> = {
  engineer: 'Site Engineer',
  pm: 'Project Manager',
  foreman: 'Foreman',
  qs: 'Quantity Surveyor',
  storekeeper: 'Storekeeper',
}

export default function InvitePage() {
  const params = useParams()
  const token = params.token as string
  const router = useRouter()

  const [invite, setInvite] = useState<Invite | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)

      const { data } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', token)
        .eq('accepted', false)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

      if (!data) {
        setNotFound(true)
        setLoading(false)
        return
      }

      const [{ data: proj }, { data: inv }] = await Promise.all([
        supabase.from('projects').select('name').eq('id', data.project_id as string).single(),
        supabase.from('profiles').select('full_name').eq('id', data.invited_by as string).single(),
      ])

      setInvite({
        id: data.id as string,
        project_id: data.project_id as string,
        company_id: data.company_id as string,
        email: data.email as string,
        role: data.role as string,
        invited_by: data.invited_by as string,
        projectName: proj?.name ?? '',
        inviterName: inv?.full_name ?? 'Someone',
      })
      setLoading(false)
    }
    load()
  }, [token])

  async function handleAccept() {
    if (!invite || !userId) return
    setAccepting(true)
    setError(null)

    const supabase = createClient()

    const { error: memberErr } = await supabase
      .from('project_members')
      .insert({ project_id: invite.project_id, user_id: userId, role: invite.role })

    if (memberErr) {
      setError('Failed to accept. You may already be a member of this project.')
      setAccepting(false)
      return
    }

    await Promise.all([
      supabase
        .from('company_members')
        .insert({ company_id: invite.company_id, user_id: userId, role: invite.role }),
      supabase.from('invitations').update({ accepted: true }).eq('id', invite.id),
      supabase
        .from('profiles')
        .update({ role: invite.role as UserRole })
        .eq('id', userId),
      supabase.auth.updateUser({ data: { has_company: true, role: invite.role } }),
    ])

    await supabase.auth.refreshSession()
    const dest = getRedirectPath(invite.role as UserRole)
    router.push(dest)
    router.refresh()
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#F5F6FA' }}
      >
        <div
          className="w-10 h-10 rounded-full animate-pulse"
          style={{ backgroundColor: '#E4E9FA' }}
        />
      </div>
    )
  }

  if (notFound) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-5"
        style={{ backgroundColor: '#F5F6FA' }}
      >
        <div className="text-center">
          <p className="font-semibold mb-2" style={{ color: '#111111' }}>
            This invitation is invalid or has expired
          </p>
          <Link href="/login" className="text-sm" style={{ color: '#00236F' }}>
            Go to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-5"
      style={{ backgroundColor: '#F5F6FA' }}
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl p-8"
        style={{ border: '0.5px solid #EEEEEE' }}
      >
        <h1 className="text-xl font-semibold mb-2" style={{ color: '#111111' }}>
          You have been invited to join {invite?.projectName}
        </h1>
        <p className="text-sm mb-6" style={{ color: '#666666' }}>
          {invite?.inviterName} has invited you as{' '}
          {ROLE_LABEL[invite?.role ?? ''] ?? invite?.role} on this project.
        </p>

        {error && (
          <div
            className="mb-4 px-4 py-3 rounded-lg text-sm"
            style={{ backgroundColor: '#FFF5F5', color: '#E24B4A' }}
          >
            {error}
          </div>
        )}

        {userId ? (
          userId === invite?.invited_by ? (
            <div className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: '#E4E9FA', color: '#00236F' }}>
              This is the invitation you created for {invite?.email}. Share this link with them so they can join the project.
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAccept}
              disabled={accepting}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: '#00236F' }}
            >
              {accepting ? 'Accepting...' : 'Accept invitation'}
            </button>
          )
        ) : (
          <div className="flex flex-col gap-3">
            <Link
              href={`/signup?next=/invite/${token}`}
              className="block w-full py-3.5 rounded-xl text-sm font-semibold text-white text-center"
              style={{ backgroundColor: '#00236F' }}
            >
              Create account and join
            </Link>
            <Link
              href={`/login?next=/invite/${token}`}
              className="block w-full py-3.5 rounded-xl text-sm font-semibold text-center"
              style={{ border: '1px solid #00236F', color: '#00236F' }}
            >
              Sign in and join
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
