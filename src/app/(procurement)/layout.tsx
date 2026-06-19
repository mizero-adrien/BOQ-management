'use client'

import BaseLayout, { type NavItem } from '@/components/layout/BaseLayout'
import { NotificationProvider } from '@/contexts/NotificationContext'
import PageErrorBoundary from '@/components/shared/PageErrorBoundary'
import ToastContainer from '@/components/shared/ToastContainer'

const C = '#00236F'
const G = '#BBBBBB'

function icon(path: React.ReactNode, active: boolean) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={active ? C : G} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {path}
    </svg>
  )
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/procurement/dashboard',
    icon: (a) => icon(<><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></>, a),
  },
  {
    label: 'Messages',
    href: '/procurement/messages',
    icon: (a) => icon(<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />, a),
  },
  {
    label: 'Requests',
    href: '/procurement/requests',
    icon: (a) => icon(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></>, a),
  },
  {
    label: 'Orders',
    href: '/procurement/orders',
    icon: (a) => icon(<><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></>, a),
  },
  {
    label: 'Suppliers',
    href: '/procurement/suppliers',
    icon: (a) => icon(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>, a),
  },
  {
    label: 'Variance',
    href: '/procurement/variance',
    icon: (a) => icon(<><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" /></>, a),
  },
  {
    label: 'Me',
    href: '/procurement/profile',
    icon: (a) => icon(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>, a),
  },
]

export default function ProcurementLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageErrorBoundary>
      <NotificationProvider>
        <BaseLayout navItems={navItems} backButton={true}>{children}</BaseLayout>
        <ToastContainer />
      </NotificationProvider>
    </PageErrorBoundary>
  )
}
