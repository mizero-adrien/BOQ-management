'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAdminRole, type AdminLevel } from '@/hooks/useAdminRole'

type NavItem = { label: string; href: string; Icon: () => React.ReactNode; superAdminOnly?: boolean }

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', Icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg> },
  { label: 'Companies', href: '/admin/companies', Icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v18Z" /><path d="M9 9h1M14 9h1M9 13h1M14 13h1M9 17h1M14 17h1" /></svg> },
  { label: 'Users', href: '/admin/users', Icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
  { label: 'Projects', href: '/admin/projects', Icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 22V12h6v10" /></svg> },
  { label: 'Analytics', href: '/admin/analytics', Icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg> },
  { label: 'Audit Log', href: '/admin/audit', Icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="15" y2="17" /></svg> },
  { label: 'Settings', href: '/admin/settings', superAdminOnly: true, Icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg> },
]

function AdminLevelIndicator({ adminLevel }: { adminLevel: AdminLevel }) {
  return (
    <div style={{ padding: '10px 16px 4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '6px', backgroundColor: '#2D1515' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: adminLevel === 'super_admin' ? '#DC2626' : '#F87171', flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>
            {adminLevel === 'super_admin' ? 'Super Admin' : 'Admin'}
          </p>
          <p style={{ fontSize: '10px', color: '#6B7280', margin: 0 }}>
            {adminLevel === 'super_admin' ? 'Full access' : 'Limited access'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { adminLevel, isSuperAdmin } = useAdminRole()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut({ scope: 'local' })
    router.push('/login')
  }

  const visibleItems = navItems.filter((item) => !item.superAdminOnly || isSuperAdmin)

  return (
    <aside
      className="hidden md:flex md:flex-col md:flex-shrink-0"
      style={{ width: '240px', height: '100vh', position: 'sticky', top: 0, backgroundColor: '#1A0A0A', borderRight: '1px solid #2D1515' }}
    >
      <div style={{ padding: '16px', borderBottom: '1px solid #2D1515', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2 3 7v6c0 5 3.8 8.4 9 9 5.2-.6 9-4 9-9V7z" />
          </svg>
        </div>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', lineHeight: 1.25 }}>Admin<br />Panel</span>
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', paddingTop: '12px' }}>
        <p style={{ padding: '4px 16px 4px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', margin: 0 }}>
          Platform
        </p>
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href} className={`admin-sb-item${isActive ? ' active' : ''}`} aria-current={isActive ? 'page' : undefined}>
              <item.Icon />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <AdminLevelIndicator adminLevel={adminLevel} />

      <div style={{ padding: '8px 16px 16px' }}>
        <button
          type="button"
          onClick={handleSignOut}
          className="admin-sb-item"
          style={{ justifyContent: 'flex-start' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  )
}
