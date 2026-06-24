'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useProfile } from '@/hooks/useProfile'
import { useSignOut } from '@/hooks/useSignOut'

type SectionItem = { label: string; href: string; Icon: (p: { active: boolean }) => React.ReactNode }

const IA = '#FFFFFF'
const II = '#6B7D8D'

const navSections: { label: string; items: SectionItem[] }[] = [
  {
    label: 'OVERVIEW',
    items: [
      { label: 'Dashboard', href: '/pm/dashboard', Icon: ({ active }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? IA : II} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg> },
      { label: 'Schedule', href: '/pm/schedule', Icon: ({ active }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? IA : II} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> },
    ],
  },
  {
    label: 'MANAGEMENT',
    items: [
      { label: 'Reports', href: '/pm/reports', Icon: ({ active }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? IA : II} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg> },
      { label: 'Projects', href: '/pm/projects', Icon: ({ active }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? IA : II} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 22V12h6v10" /><path d="M9 7h1" /><path d="M14 7h1" /><path d="M9 11h1" /><path d="M14 11h1" /></svg> },
      { label: 'Team', href: '/pm/team', Icon: ({ active }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? IA : II} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
    ],
  },
  {
    label: 'FINANCIALS',
    items: [
      { label: 'BOQ', href: '/pm/boq', Icon: ({ active }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? IA : II} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" /></svg> },
      { label: 'Analytics', href: '/pm/analytics', Icon: ({ active }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? IA : II} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg> },
      { label: 'Procurement', href: '/pm/procurement', Icon: ({ active }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? IA : II} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg> },
    ],
  },
  {
    label: 'ACCOUNT',
    items: [
      { label: 'Profile', href: '/pm/profile', Icon: ({ active }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? IA : II} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> },
      { label: 'Settings', href: '/pm/settings', Icon: ({ active }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? IA : II} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg> },
    ],
  },
]

export default function PMSidebar() {
  const pathname = usePathname()
  const { profile } = useProfile()
  const { signOut } = useSignOut()

  const initials = profile?.full_name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() ?? ''

  return (
    <aside className="hidden md:flex md:flex-col md:flex-shrink-0"
      style={{ width: '240px', height: '100vh', position: 'sticky', top: 0, backgroundColor: '#0D1F2D' }}>

      <div style={{ padding: '16px', borderBottom: '1px solid #1A2E3D', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#1565D8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 22V12h6v10" />
              <path d="M9 7h1" /><path d="M14 7h1" /><path d="M9 11h1" /><path d="M14 11h1" />
            </svg>
          </div>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', lineHeight: 1.25 }}>Construction<br />Manager</span>
        </div>
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', paddingBottom: '8px' }}>
        {navSections.map((section) => (
          <div key={section.label}>
            <p style={{ padding: '20px 16px 4px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#4A6072', margin: 0 }}>
              {section.label}
            </p>
            {section.items.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/pm/dashboard' && pathname.startsWith(item.href))
              return (
                <Link key={item.href} href={item.href} className={`sb-item${isActive ? ' active' : ''}`} aria-current={isActive ? 'page' : undefined}>
                  <item.Icon active={isActive} />
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div style={{ borderTop: '1px solid #1A2E3D', padding: '12px 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#1565D8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>{initials}</span>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: '13px', fontWeight: 500, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
              {profile?.full_name ?? 'Loading...'}
            </p>
            <p style={{ fontSize: '11px', color: '#8FA3B3', margin: 0 }}>Project Manager</p>
          </div>
        </div>
        <button type="button" onClick={signOut}
          style={{ marginTop: '8px', background: 'none', border: 'none', padding: 0, fontSize: '12px', color: '#8FA3B3', cursor: 'pointer' }}>
          Sign out
        </button>
      </div>
    </aside>
  )
}
