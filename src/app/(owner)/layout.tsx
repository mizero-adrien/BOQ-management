'use client'

import { usePathname } from 'next/navigation'
import BaseLayout, { type NavItem } from '@/components/layout/BaseLayout'

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

function buildNavItems(projectId: string): NavItem[] {
  return [
    {
      label: 'Overview',
      href: `/owner/${projectId}`,
      icon: (a) => icon(<><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>, a, true),
    },
    {
      label: 'Photos',
      href: `/owner/${projectId}/photos`,
      icon: (a) => icon(<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></>, a),
    },
    {
      label: 'BOQ',
      href: `/owner/${projectId}/boq`,
      icon: (a) => icon(<><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></>, a),
    },
    {
      label: 'Reports',
      href: `/owner/${projectId}/reports`,
      icon: (a) => icon(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></>, a),
    },
  ]
}

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const match = pathname.match(/^\/owner\/([^/]+)/)
  const projectId = match?.[1] ?? ''
  const navItems: NavItem[] = projectId ? buildNavItems(projectId) : []

  return <BaseLayout navItems={navItems}>{children}</BaseLayout>
}
