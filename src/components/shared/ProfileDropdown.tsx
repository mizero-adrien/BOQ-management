'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useProfile } from '@/hooks/useProfile'
import { useSignOut } from '@/hooks/useSignOut'
import { createClient } from '@/lib/supabase/client'

interface ProfileDropdownProps {
  profileHref: string
  settingsHref: string
}

export default function ProfileDropdown({ profileHref, settingsHref }: ProfileDropdownProps) {
  const { profile } = useProfile()
  const { signOut } = useSignOut()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const initials = profile?.full_name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() ?? ''

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? '')
    })
  }, [])

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Profile menu"
        style={{
          width: '32px', height: '32px', borderRadius: '50%',
          backgroundColor: '#1565D8', color: '#FFFFFF',
          fontSize: '12px', fontWeight: 700, cursor: 'pointer',
          border: open ? '2px solid #DDE3E8' : '2px solid transparent',
          transition: 'border-color 0.15s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
        {initials}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '44px', right: 0, width: '220px',
          backgroundColor: '#FFFFFF', border: '1px solid #DDE3E8',
          borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          zIndex: 100, overflow: 'hidden',
        }}>
          {/* User info */}
          <div style={{ padding: '14px 16px', backgroundColor: '#F4F6F8' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              backgroundColor: '#1565D8', color: '#FFFFFF',
              fontSize: '14px', fontWeight: 700, marginBottom: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {initials}
            </div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#1A2332', margin: '0 0 2px' }}>
              {profile?.full_name ?? ''}
            </p>
            <p style={{ fontSize: '12px', color: '#8FA3B3', margin: 0 }}>
              {profile?.role ? labelForRole(profile.role) : ''}
            </p>
            {email && <p style={{ fontSize: '11px', color: '#8FA3B3', marginTop: '2px' }}>{email}</p>}
          </div>

          {/* Quick actions */}
          <div style={{ borderTop: '1px solid #DDE3E8' }}>
            <DropLink href={profileHref} label="My profile" icon={<PersonIcon />} onClose={() => setOpen(false)} />
            <DropLink href={settingsHref} label="Settings" icon={<GearIcon />} onClose={() => setOpen(false)} />
          </div>

          {/* Sign out */}
          <SignOutRow onSignOut={() => { setOpen(false); signOut() }} />
        </div>
      )}
    </div>
  )
}

function DropLink({ href, label, icon, onClose }: { href: string; label: string; icon: React.ReactNode; onClose: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link href={href} onClick={onClose}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 16px', fontSize: '13px', color: '#1A2332',
        textDecoration: 'none', backgroundColor: hovered ? '#F4F6F8' : 'transparent',
        transition: 'background-color 0.1s',
      }}>
      <span style={{ color: '#8FA3B3', display: 'flex' }}>{icon}</span>
      {label}
    </Link>
  )
}

function SignOutRow({ onSignOut }: { onSignOut: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div style={{ borderTop: '1px solid #DDE3E8' }}>
      <button type="button" onClick={onSignOut}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 16px', fontSize: '13px', color: '#E24B4A',
          cursor: 'pointer', background: hovered ? '#FFF5F5' : 'none',
          border: 'none', textAlign: 'left', transition: 'background-color 0.1s',
        }}>
        <LogoutIcon />
        Sign out
      </button>
    </div>
  )
}

function PersonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

function labelForRole(role: string): string {
  const map: Record<string, string> = {
    pm: 'Project Manager', engineer: 'Site Engineer', foreman: 'Foreman',
    qs: 'Quantity Surveyor', storekeeper: 'Storekeeper',
    procurement: 'Procurement Officer', owner: 'Project Owner',
  }
  return map[role] ?? role
}
