'use client'

import BaseLayout, { type NavItem } from '@/components/layout/BaseLayout'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { ActiveProjectProvider } from '@/contexts/ActiveProjectContext'
import PageErrorBoundary from '@/components/shared/PageErrorBoundary'
import ToastContainer from '@/components/shared/ToastContainer'
import OfflineSyncBanner from '@/components/shared/OfflineSyncBanner'

const C = '#FFFFFF'
const G = '#6B7D8D'

function icon(path: React.ReactNode, active: boolean, filled = false) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled && active ? C : 'none'}
      stroke={active ? C : G} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {path}
    </svg>
  )
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/foreman/dashboard', section: 'DAILY WORK', icon: (a) => icon(<><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>, a, true) },
  { label: 'My Crew', href: '/foreman/crew', section: 'DAILY WORK', icon: (a) => icon(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>, a) },
  { label: 'Daily Log', href: '/foreman/log', section: 'DAILY WORK', icon: (a) => icon(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></>, a) },
  { label: 'History', href: '/foreman/report/history', section: 'DAILY WORK', icon: (a) => icon(<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>, a) },
  { label: 'Tasks', href: '/foreman/tasks', section: 'TEAM', icon: (a) => icon(<><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></>, a) },
  { label: 'Me', href: '/foreman/profile', section: 'ACCOUNT', icon: (a) => icon(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>, a, true) },
]

export default function ForemanLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageErrorBoundary>
      <NotificationProvider>
        <ActiveProjectProvider>
          <BaseLayout navItems={navItems} messagesHref="/foreman/messages" notificationsHref="/foreman/notifications">{children}</BaseLayout>
          <OfflineSyncBanner />
          <ToastContainer />
        </ActiveProjectProvider>
      </NotificationProvider>
    </PageErrorBoundary>
  )
}
