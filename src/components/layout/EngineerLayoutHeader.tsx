'use client'

import { usePathname } from 'next/navigation'
import AppHeader from '@/components/shared/AppHeader'
import { useActiveProject } from '@/hooks/useActiveProject'

const ENG_TITLES: [string, string][] = [
  ['/report/history', 'History'],
  ['/report', 'Report'],
  ['/dashboard', 'Home'],
  ['/tasks', 'Tasks'],
  ['/boq', 'BOQ'],
  ['/profile', 'Profile'],
  ['/notifications', 'Notifications'],
  ['/messages', 'Messages'],
]

export default function EngineerLayoutHeader() {
  const pathname = usePathname()
  const { project } = useActiveProject()
  const match = ENG_TITLES
    .filter(([prefix]) => pathname === prefix || pathname.startsWith(prefix + '/'))
    .sort((a, b) => b[0].length - a[0].length)[0]

  return (
    <AppHeader
      title={match?.[1] ?? 'Home'}
      subtitle={project?.name}
      messagesHref="/messages"
      notificationsHref="/notifications"
      profileHref="/profile"
      settingsHref="/profile"
    />
  )
}
