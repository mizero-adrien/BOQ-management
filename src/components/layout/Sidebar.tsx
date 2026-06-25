'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useNotifications } from '@/hooks/useNotifications'
import NotificationBell from '@/components/shared/NotificationBell'
import MessagesButton from '@/components/shared/MessagesButton'
import ProjectSwitcher from '@/components/layout/ProjectSwitcher'

const IA = '#FFFFFF'
const II = '#6B7D8D'

type SectionItem = { label: string; href: string; Icon: (p: { active: boolean }) => React.ReactNode }

const navSections: { label: string; items: SectionItem[] }[] = [
  {
    label: 'DAILY WORK',
    items: [
      { label: 'Home', href: '/dashboard', Icon: ({ active }) => <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? IA : 'none'} stroke={active ? IA : II} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg> },
      { label: 'Report', href: '/report/new', Icon: ({ active }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? IA : II} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg> },
      { label: 'Tasks', href: '/tasks', Icon: ({ active }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? IA : II} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg> },
    ],
  },
  {
    label: 'SITE DATA',
    items: [
      { label: 'BOQ', href: '/boq', Icon: ({ active }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? IA : II} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /><line x1="7" y1="8" x2="7" y2="12" /><line x1="12" y1="6" x2="12" y2="12" /><line x1="17" y1="10" x2="17" y2="12" /></svg> },
      { label: 'History', href: '/report/history', Icon: ({ active }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? IA : II} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg> },
    ],
  },
  {
    label: 'ACCOUNT',
    items: [
      { label: 'Me', href: '/profile', Icon: ({ active }) => <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? IA : 'none'} stroke={active ? IA : II} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { unreadCount } = useNotifications()

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <MessagesButton href="/messages" />
          <NotificationBell unreadCount={unreadCount} href="/notifications" />
        </div>
      </div>

      <ProjectSwitcher />

      <nav style={{ flex: 1, overflowY: 'auto', paddingBottom: '16px' }}>
        {navSections.map((section) => (
          <div key={section.label}>
            <p style={{ padding: '20px 16px 4px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#4A6072', margin: 0 }}>
              {section.label}
            </p>
            {section.items.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
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
    </aside>
  )
}
