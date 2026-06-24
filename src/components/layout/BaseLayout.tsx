'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useProfile } from '@/hooks/useProfile'
import { useSignOut } from '@/hooks/useSignOut'
import { useNotifications } from '@/hooks/useNotifications'
import NotificationBell from '@/components/shared/NotificationBell'
import MessagesButton from '@/components/shared/MessagesButton'
import { formatRole } from '@/lib/utils/roleLabels'
import MobileTopBar from '@/components/layout/MobileTopBar'

export interface NavItem {
  label: string
  href: string
  icon: (active: boolean) => React.ReactNode
  exact?: boolean
  section?: string
}

interface BaseLayoutProps {
  children: React.ReactNode
  navItems: NavItem[]
  backButton?: boolean
  messagesHref?: string
  notificationsHref?: string
}

function navIsActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact || href.endsWith('/dashboard') || href.endsWith('/profile') || href === '/dashboard') {
    return pathname === href
  }
  return pathname.startsWith(href)
}

function LogoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 22V12h6v10" />
      <path d="M9 7h1" /><path d="M14 7h1" />
      <path d="M9 11h1" /><path d="M14 11h1" />
    </svg>
  )
}

function BaseSidebar({ navItems, backButton, messagesHref, notificationsHref }: { navItems: NavItem[]; backButton?: boolean; messagesHref?: string; notificationsHref?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const { profile } = useProfile()
  const { signOut } = useSignOut()
  const { unreadCount } = useNotifications()
  const initials = profile?.full_name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() ?? ''

  return (
    <aside className="hidden md:flex md:flex-col md:flex-shrink-0"
      style={{ width: '240px', height: '100vh', position: 'sticky', top: 0, backgroundColor: '#0D1F2D' }}>

      <div style={{ padding: '16px', borderBottom: '1px solid #1A2E3D', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#1565D8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <LogoIcon />
          </div>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', lineHeight: 1.25 }}>Construction<br />Manager</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {messagesHref && <MessagesButton href={messagesHref} />}
          <NotificationBell unreadCount={unreadCount} href={notificationsHref} />
        </div>
      </div>

      {backButton && (
        <div style={{ padding: '8px 12px 0' }}>
          <button type="button" onClick={() => router.back()}
            className="sb-item"
            style={{ color: '#8FA3B3' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back
          </button>
        </div>
      )}

      <nav style={{ flex: 1, overflowY: 'auto', paddingBottom: '8px' }}>
        {navItems.flatMap((item, i) => {
          const active = navIsActive(pathname, item.href, item.exact)
          const showSection = item.section !== undefined && (i === 0 || item.section !== navItems[i - 1].section)
          const nodes: React.ReactNode[] = []
          if (showSection) {
            nodes.push(
              <p key={`sec-${item.section}-${i}`} style={{ padding: '20px 16px 4px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#4A6072', margin: 0 }}>
                {item.section}
              </p>
            )
          }
          nodes.push(
            <Link key={item.href} href={item.href} className={`sb-item${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined}>
              {item.icon(active)}
              <span>{item.label}</span>
            </Link>
          )
          return nodes
        })}
      </nav>

      <div style={{ borderTop: '1px solid #1A2E3D', padding: '12px 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#1565D8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>{initials}</span>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: '13px', fontWeight: 500, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
              {profile?.full_name ?? 'Loading...'}
            </p>
            <p style={{ fontSize: '11px', color: '#8FA3B3', margin: 0 }}>{profile?.role ? formatRole(profile.role) : ''}</p>
          </div>
        </div>
        <button type="button" onClick={signOut}
          style={{ marginTop: '8px', background: 'none', border: 'none', padding: 0, fontSize: '12px', color: '#8FA3B3', cursor: 'pointer' }}>
          Sign out
        </button>
      </div>
    </aside>
  )
}

function BaseBottomNav({ navItems }: { navItems: NavItem[] }) {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-bottom"
      style={{ backgroundColor: '#0D1F2D', borderTop: '1px solid #1A2E3D' }}
      aria-label="Main navigation">
      <div className="flex items-center justify-around px-2 h-16">
        {navItems.slice(0, 5).map((item) => {
          const active = navIsActive(pathname, item.href, item.exact)
          return (
            <Link key={item.href} href={item.href}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full"
              style={{ color: active ? '#FFFFFF' : '#4A6072' }}
              aria-current={active ? 'page' : undefined}>
              {item.icon(active)}
              <span className="text-[10px] font-medium" style={{ color: active ? '#FFFFFF' : '#4A6072' }}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default function BaseLayout({ children, navItems, backButton, messagesHref, notificationsHref }: BaseLayoutProps) {
  const overflowItems = navItems.slice(5).map((item) => ({ label: item.label, href: item.href }))
  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ backgroundColor: '#F4F6F8' }}>
      <MobileTopBar backButton={backButton} messagesHref={messagesHref} notificationsHref={notificationsHref} overflowItems={overflowItems} />
      <BaseSidebar navItems={navItems} backButton={backButton} messagesHref={messagesHref} notificationsHref={notificationsHref} />
      <main className="flex-1 min-w-0 w-full pb-20 pt-14 md:pt-0 md:pb-0">{children}</main>
      <BaseBottomNav navItems={navItems} />
    </div>
  )
}
