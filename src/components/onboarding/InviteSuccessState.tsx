'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import InviteSharePanel from '@/components/shared/InviteSharePanel'
import { generateInviteMessage } from '@/lib/utils/inviteMessage'

interface CreatedInvite {
  email: string
  token: string
  role: string
}

interface Props {
  invites: CreatedInvite[]
  projectId: string
}

export default function InviteSuccessState({ invites, projectId }: Props) {
  const [projectName, setProjectName] = useState('')
  const [pmName, setPmName] = useState('')

  useEffect(() => {
    if (!projectId) return
    const supabase = createClient()
    async function load() {
      const [{ data: proj }, { data: { user } }] = await Promise.all([
        supabase.from('projects').select('name').eq('id', projectId).single(),
        supabase.auth.getUser(),
      ])
      setProjectName(proj?.name ?? '')
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
        setPmName(profile?.full_name ?? '')
      }
    }
    load()
  }, [projectId])

  return (
    <div className="bg-white rounded-2xl p-6" style={{ border: '0.5px solid #EEEEEE' }}>
      <h1 className="font-semibold mb-1" style={{ color: '#111111', fontSize: '20px' }}>
        Invitations ready to share
      </h1>
      <p className="text-sm mb-5" style={{ color: '#666666' }}>
        Use the links or messages below to share with your team members.
      </p>
      <div className="flex flex-col gap-4 mb-6">
        {invites.map((inv) => {
          const link = `${window.location.origin}/invite/${inv.token}`
          const message = generateInviteMessage(
            null,
            projectName || 'your project',
            inv.role,
            pmName || 'Your project manager',
            link
          )
          return (
            <div key={inv.token}>
              <p className="text-xs font-medium mb-1.5" style={{ color: '#666666' }}>{inv.email}</p>
              <InviteSharePanel link={link} message={message} />
            </div>
          )
        })}
      </div>
      <button
        type="button"
        onClick={() => { window.location.href = '/pm/dashboard' }}
        className="w-full py-3.5 rounded-xl text-sm font-semibold text-white"
        style={{ backgroundColor: '#00236F' }}
      >
        Go to dashboard
      </button>
    </div>
  )
}
