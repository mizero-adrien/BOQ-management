'use client'

export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const MESSAGES: Record<string, { heading: string; body: string; action: string; href: string }> = {
  pending_invitation: {
    heading: 'Waiting for invitation',
    body: 'You have not been added to any project yet. Ask your project manager to send you an invitation.',
    action: 'Check for an invite link',
    href: '/invite',
  },
  removed: {
    heading: 'Removed from project',
    body: 'You are no longer a member of any active project. Contact your project manager to be re-added.',
    action: 'Back to login',
    href: '/login',
  },
  all_completed: {
    heading: 'All projects completed',
    body: 'All projects you were assigned to have been completed. Join a new project to continue.',
    action: 'Join a project',
    href: '/invite',
  },
  new_user: {
    heading: 'No project yet',
    body: 'Your account is set up. You need to join a project before you can access the platform.',
    action: 'Join a project',
    href: '/invite',
  },
}

function NoProjectContent() {
  const params = useSearchParams()
  const reason = params.get('reason') ?? 'new_user'
  const msg = MESSAGES[reason] ?? MESSAGES.new_user

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F4F6F8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '420px', width: '100%', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '0.5px solid #DDE3E8', padding: '40px 32px', textAlign: 'center' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#E4E9FA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1565D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>

        <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#111111', marginBottom: '12px' }}>
          {msg.heading}
        </h1>
        <p style={{ fontSize: '14px', color: '#666666', lineHeight: '1.6', marginBottom: '28px' }}>
          {msg.body}
        </p>

        <Link
          href={msg.href}
          style={{ display: 'inline-block', padding: '12px 24px', backgroundColor: '#1565D8', color: '#FFFFFF', borderRadius: '8px', fontSize: '14px', fontWeight: '600', textDecoration: 'none' }}
        >
          {msg.action}
        </Link>
      </div>
    </div>
  )
}

export default function NoProjectPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', backgroundColor: '#F4F6F8' }} />}>
      <NoProjectContent />
    </Suspense>
  )
}
