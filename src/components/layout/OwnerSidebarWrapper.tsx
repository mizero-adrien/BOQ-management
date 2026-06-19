'use client'

import { useParams } from 'next/navigation'
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

export default function OwnerSidebarWrapper({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const projectId = (params?.projectId as string) ?? ''

  const navItems: NavItem[] = [
    {
      label: 'Overview',
      href: `/owner/${projectId}`,
      exact: true,
      icon: (a) => icon(<><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></>, a),
    },
    {
      label: 'Messages',
      href: `/owner/${projectId}/messages`,
      icon: (a) => icon(<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />, a),
    },
    {
      label: 'Photos',
      href: `/owner/${projectId}/photos`,
      icon: (a) => icon(<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></>, a),
    },
    {
      label: 'BOQ',
      href: `/owner/${projectId}/boq`,
      icon: (a) => icon(<><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" /></>, a),
    },
    {
      label: 'Reports',
      href: `/owner/${projectId}/reports`,
      icon: (a) => icon(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></>, a),
    },
    {
      label: 'Notifications',
      href: `/owner/${projectId}/notifications`,
      icon: (a) => icon(<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>, a),
    },
    {
      label: 'Profile',
      href: `/owner/${projectId}/profile`,
      icon: (a) => icon(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>, a),
    },
  ]

  return (
    <PageErrorBoundary>
      <NotificationProvider>
        <BaseLayout navItems={navItems}>{children}</BaseLayout>
        <ToastContainer />
      </NotificationProvider>
    </PageErrorBoundary>
  )
}
