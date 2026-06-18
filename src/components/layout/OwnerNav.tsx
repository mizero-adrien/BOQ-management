'use client'

import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useNotificationContext } from '@/contexts/NotificationContext'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'

function BuildingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 22V12h6v10" />
      <path d="M9 7h1" /><path d="M14 7h1" />
      <path d="M9 11h1" /><path d="M14 11h1" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export default function OwnerNav() {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const { unreadCount } = useNotificationContext()
  const projectId = (params?.projectId as string) ?? ''

  async function handleSignOut() {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) { toast.error('Sign out failed', error.message); return }
    router.push('/login')
  }

  const links = [
    { label: 'Overview', href: `/owner/${projectId}` },
    { label: 'Photos', href: `/owner/${projectId}/photos` },
    { label: 'BOQ', href: `/owner/${projectId}/boq` },
    { label: 'Reports', href: `/owner/${projectId}/reports` },
  ]

  return (
    <nav style={{ backgroundColor: '#00236F', height: '56px', display: 'flex',
      alignItems: 'center', paddingLeft: '20px', paddingRight: '20px', gap: '0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '200px' }}>
        <BuildingIcon />
        <span style={{ color: '#FFFFFF', fontWeight: '600', fontSize: '15px', whiteSpace: 'nowrap' }}>
          Project Dashboard
        </span>
      </div>

      {projectId && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          {links.map((link) => {
            const isActive = link.href === `/owner/${projectId}`
              ? pathname === link.href
              : pathname.startsWith(link.href)
            return (
              <Link key={link.href} href={link.href}
                style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '14px', fontWeight: '500',
                  color: '#FFFFFF', textDecoration: 'none', whiteSpace: 'nowrap',
                  backgroundColor: isActive ? 'rgba(255,255,255,0.18)' : 'transparent' }}>
                {link.label}
              </Link>
            )
          })}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
        {projectId && (
          <Link href={`/owner/${projectId}/notifications`}
            style={{ position: 'relative', display: 'flex', alignItems: 'center',
              justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px',
              backgroundColor: 'rgba(255,255,255,0.12)' }}>
            <BellIcon />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: '4px', right: '4px', width: '8px', height: '8px',
                borderRadius: '50%', backgroundColor: '#E24B4A', border: '1.5px solid #00236F' }} />
            )}
          </Link>
        )}
        {projectId && (
          <Link href={`/owner/${projectId}/profile`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '36px', height: '36px', borderRadius: '8px',
              backgroundColor: 'rgba(255,255,255,0.12)' }}>
            <UserIcon />
          </Link>
        )}
        <button type="button" onClick={handleSignOut}
          style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: '500',
            color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.35)',
            backgroundColor: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Sign out
        </button>
      </div>
    </nav>
  )
}
