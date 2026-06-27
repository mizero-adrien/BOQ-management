'use client'

import { usePathname } from 'next/navigation'
import AppHeader from '@/components/shared/AppHeader'

const PM_TITLES: [string, string][] = [
  ['/pm/dashboard', 'Dashboard'],
  ['/pm/schedule', 'Schedule'],
  ['/pm/reports', 'Reports'],
  ['/pm/projects', 'Projects'],
  ['/pm/analytics', 'Analytics'],
  ['/pm/team', 'Team'],
  ['/pm/boq', 'BOQ'],
  ['/pm/procurement', 'Procurement'],
  ['/pm/profile', 'Profile'],
  ['/pm/settings', 'Settings'],
  ['/pm/messages', 'Messages'],
  ['/pm/notifications', 'Notifications'],
]

export default function PMLayoutHeader() {
  const pathname = usePathname()
  const match = PM_TITLES
    .filter(([prefix]) => pathname === prefix || pathname.startsWith(prefix + '/'))
    .sort((a, b) => b[0].length - a[0].length)[0]

  return (
    <AppHeader
      title={match?.[1] ?? 'PM'}
      messagesHref="/pm/messages"
      notificationsHref="/pm/notifications"
      profileHref="/pm/profile"
      settingsHref="/pm/settings"
    />
  )
}
