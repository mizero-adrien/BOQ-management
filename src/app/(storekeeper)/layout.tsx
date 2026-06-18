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
  { label: 'Dashboard', href: '/storekeeper/dashboard', icon: (a) => icon(<><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>, a, true) },
  { label: 'Stock In', href: '/storekeeper/stock-in', icon: (a) => icon(<><polyline points="8 17 12 21 16 17" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" /></>, a) },
  { label: 'Stock Out', href: '/storekeeper/stock-out', icon: (a) => icon(<><polyline points="16 7 12 3 8 7" /><line x1="12" y1="12" x2="12" y2="3" /><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" /></>, a) },
  { label: 'Inventory', href: '/storekeeper/inventory', icon: (a) => icon(<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></>, a) },
  { label: 'Me', href: '/storekeeper/profile', icon: (a) => icon(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>, a, true) },
  { label: 'Notifications', href: '/storekeeper/notifications', icon: (a) => icon(<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>, a) },
]

export default function StorekeeperLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageErrorBoundary>
      <NotificationProvider>
        <BaseLayout navItems={navItems}>{children}</BaseLayout>
        <ToastContainer />
      </NotificationProvider>
    </PageErrorBoundary>
  )
}
