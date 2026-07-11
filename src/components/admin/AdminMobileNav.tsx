'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAdminRole } from '@/hooks/useAdminRole'

const items = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Companies', href: '/admin/companies' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Projects', href: '/admin/projects' },
  { label: 'Analytics', href: '/admin/analytics' },
  { label: 'Audit Log', href: '/admin/audit' },
  { label: 'Settings', href: '/admin/settings', superAdminOnly: true },
]

export default function AdminMobileNav() {
  const pathname = usePathname()
  const { isSuperAdmin } = useAdminRole()
  const visible = items.filter((i) => !i.superAdminOnly || isSuperAdmin)

  return (
    <div
      className="md:hidden"
      style={{ backgroundColor: '#1A0A0A', borderBottom: '1px solid #2D1515', display: 'flex', overflowX: 'auto', padding: '10px 12px', gap: '8px' }}
    >
      {visible.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flexShrink: 0, padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
              backgroundColor: isActive ? '#DC2626' : 'transparent',
              color: isActive ? '#FFFFFF' : '#9CA3AF',
              whiteSpace: 'nowrap',
            }}
          >
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}
