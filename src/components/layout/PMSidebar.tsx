'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useProfile } from '@/hooks/useProfile'
import { useSignOut } from '@/hooks/useSignOut'
import { useNotifications } from '@/hooks/useNotifications'
import NotificationBell from '@/components/shared/NotificationBell'
import MessagesButton from '@/components/shared/MessagesButton'

const navItems = [
  { label: 'Dashboard', href: '/pm/dashboard', icon: DashboardIcon },
  { label: 'Schedule', href: '/pm/schedule', icon: ScheduleIcon },
  { label: 'Reports', href: '/pm/reports', icon: ReportsIcon },
  { label: 'Projects', href: '/pm/projects', icon: ProjectsIcon },
  { label: 'Team', href: '/pm/team', icon: TeamIcon },
  { label: 'BOQ', href: '/pm/boq', icon: BOQIcon },
  { label: 'Procurement', href: '/pm/procurement', icon: ProcurementIcon },
  { label: 'Profile', href: '/pm/profile', icon: ProfileIcon },
  { label: 'Settings', href: '/pm/settings', icon: SettingsIcon },
]

export default function PMSidebar() {
  const pathname = usePathname()
  const { profile } = useProfile()
  const { signOut } = useSignOut()
  const { unreadCount } = useNotifications()

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? ''

  return (
    <aside
      className="hidden md:flex md:flex-col md:w-60 md:h-screen md:sticky md:top-0 md:bg-white md:border-r md:flex-shrink-0"
      style={{ borderColor: '#EEEEEE' }}
    >
      {/* Logo */}
      <div className="px-6 pt-6 pb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#00236F' }}
          >
            <BuildingIcon />
          </div>
          <span className="text-base font-semibold leading-tight" style={{ color: '#00236F' }}>
            Construction<br />Manager
          </span>
        </div>
        <div className="flex items-center gap-1">
          <MessagesButton href="/pm/messages" />
          <NotificationBell unreadCount={unreadCount} href="/pm/notifications" />
        </div>
      </div>
      <div className="border-b" style={{ borderColor: '#EEEEEE' }} />

      {/* Nav */}
      <nav className="flex-1 py-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href ||
            (item.href !== '/pm/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 mx-2 px-4 py-2.5 rounded-lg transition-colors"
              style={{
                backgroundColor: isActive ? '#E4E9FA' : 'transparent',
                color: isActive ? '#00236F' : '#666666',
              }}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon active={isActive} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="border-t" style={{ borderColor: '#EEEEEE' }}>
        <div className="px-5 py-4">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#E4E9FA' }}
            >
              <span className="text-xs font-bold" style={{ color: '#00236F' }}>{initials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate" style={{ color: '#111111' }}>
                {profile?.full_name ?? 'Loading...'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#666666' }}>Project Manager</p>
            </div>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="mt-3 w-full text-left text-xs font-medium transition-colors"
            style={{ color: '#666666' }}
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  )
}

function BuildingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 22V12h6v10" />
      <path d="M9 7h1" /><path d="M14 7h1" />
      <path d="M9 11h1" /><path d="M14 11h1" />
    </svg>
  )
}

function DashboardIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#00236F' : '#BBBBBB'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  )
}

function ScheduleIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#00236F' : '#BBBBBB'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function ReportsIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#00236F' : '#BBBBBB'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function ProjectsIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#00236F' : '#BBBBBB'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 22V12h6v10" />
      <path d="M9 7h1" /><path d="M14 7h1" />
      <path d="M9 11h1" /><path d="M14 11h1" />
    </svg>
  )
}

function TeamIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#00236F' : '#BBBBBB'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function BOQIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#00236F' : '#BBBBBB'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  )
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#00236F' : '#BBBBBB'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function ProcurementIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#00236F' : '#BBBBBB'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#00236F' : '#BBBBBB'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

