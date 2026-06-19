'use client'

import BaseLayout, { type NavItem } from '@/components/layout/BaseLayout'
import { NotificationProvider } from '@/contexts/NotificationContext'
import PageErrorBoundary from '@/components/shared/PageErrorBoundary'
import ToastContainer from '@/components/shared/ToastContainer'

const C = '#00236F'
const G = '#BBBBBB'

function icon(path: React.ReactNode, active: boolean, filled = false) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={filled && active ? C : 'none'}
      stroke={active ? C : G} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {path}
    </svg>
  )
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/qs/dashboard', icon: (a) => icon(<><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>, a, true) },
  { label: 'BOQ', href: '/qs/boq', icon: (a) => icon(<><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /><line x1="7" y1="8" x2="7" y2="12" /><line x1="12" y1="6" x2="12" y2="12" /><line x1="17" y1="10" x2="17" y2="12" /></>, a) },
  { label: 'Cost Report', href: '/qs/costs', icon: (a) => icon(<><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>, a) },
  { label: 'Variance', href: '/qs/variance', icon: (a) => icon(<><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></>, a) },
  { label: 'Me', href: '/qs/profile', icon: (a) => icon(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>, a, true) },
  { label: 'Notifications', href: '/qs/notifications', icon: (a) => icon(<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>, a) },
]

export default function QSLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageErrorBoundary>
      <NotificationProvider>
        <BaseLayout navItems={navItems} messagesHref="/qs/messages">{children}</BaseLayout>
        <ToastContainer />
      </NotificationProvider>
    </PageErrorBoundary>
  )
}
