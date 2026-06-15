'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useProfile } from '@/hooks/useProfile'
import { useSignOut } from '@/hooks/useSignOut'
import { useNotifications } from '@/hooks/useNotifications'
import NotificationBell from '@/components/shared/NotificationBell'

const navItems = [
  { label: 'Home', href: '/dashboard', icon: HomeIcon },
  { label: 'Report', href: '/report/new', icon: ReportIcon },
  { label: 'BOQ', href: '/boq', icon: BOQIcon },
  { label: 'Tasks', href: '/tasks', icon: TasksIcon },
  { label: 'Me', href: '/profile', icon: ProfileIcon },
]

export default function Sidebar() {
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

  const roleLabel = profile?.role
    ? roleDisplayName(profile.role)
    : ''

  return (
    <aside
      className="hidden md:flex md:flex-col md:w-60 md:h-screen md:sticky md:top-0 md:bg-white md:border-r md:flex-shrink-0"
      style={{ borderColor: '#EEEEEE' }}
    >
      {/* Logo section */}
      <div className="px-6 pt-6 pb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#00236F' }}
          >
            <BuildingIcon />
          </div>
          <span
            className="text-base font-semibold leading-tight"
            style={{ color: '#00236F' }}
          >
            Construction
            <br />
            Manager
          </span>
        </div>
        <NotificationBell unreadCount={unreadCount} />
      </div>
      <div className="border-b" style={{ borderColor: '#EEEEEE' }} />

      {/* Nav items */}
      <nav className="flex-1 py-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))

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

      {/* User section */}
      <div className="border-t" style={{ borderColor: '#EEEEEE' }}>
        <div className="px-5 py-4">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#E4E9FA' }}
            >
              <span
                className="text-xs font-bold"
                style={{ color: '#00236F' }}
              >
                {initials}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-sm font-medium truncate"
                style={{ color: '#111111' }}
              >
                {profile?.full_name ?? 'Loading...'}
              </p>
              <p
                className="text-xs mt-0.5 capitalize"
                style={{ color: '#666666' }}
              >
                {roleLabel}
              </p>
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

function roleDisplayName(role: string): string {
  const map: Record<string, string> = {
    engineer: 'Site Engineer',
    pm: 'Project Manager',
    foreman: 'Foreman',
    qs: 'Quantity Surveyor',
    storekeeper: 'Storekeeper',
  }
  return map[role] ?? role
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

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? '#00236F' : 'none'} stroke={active ? '#00236F' : '#BBBBBB'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function ReportIcon({ active }: { active: boolean }) {
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

function BOQIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#00236F' : '#BBBBBB'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <line x1="7" y1="8" x2="7" y2="12" />
      <line x1="12" y1="6" x2="12" y2="12" />
      <line x1="17" y1="10" x2="17" y2="12" />
    </svg>
  )
}

function TasksIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#00236F' : '#BBBBBB'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? '#00236F' : 'none'} stroke={active ? '#00236F' : '#BBBBBB'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
