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
}

interface BaseLayoutProps {
  children: React.ReactNode
  navItems: NavItem[]
  backButton?: boolean
  messagesHref?: string
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

function BaseSidebar({ navItems, backButton, messagesHref }: { navItems: NavItem[]; backButton?: boolean; messagesHref?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const { profile } = useProfile()
  const { signOut } = useSignOut()
  const { unreadCount } = useNotifications()
  const initials = profile?.full_name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() ?? ''

  return (
    <aside className="hidden md:flex md:flex-col md:w-60 md:h-screen md:sticky md:top-0 md:bg-white md:border-r md:flex-shrink-0" style={{ borderColor: '#EEEEEE' }}>
      <div className="px-6 pt-6 pb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#00236F' }}>
            <LogoIcon />
          </div>
          <span className="text-base font-semibold leading-tight" style={{ color: '#00236F' }}>
            Construction<br />Manager
          </span>
        </div>
        <div className="flex items-center gap-1">
          {messagesHref && <MessagesButton href={messagesHref} />}
          <NotificationBell unreadCount={unreadCount} />
        </div>
      </div>
      <div className="border-b" style={{ borderColor: '#EEEEEE' }} />

      {backButton && (
        <div className="px-3 pt-3 pb-1">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium"
            style={{ color: '#666666', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back
          </button>
        </div>
      )}

      <nav className="flex-1 py-3 space-y-0.5">
        {navItems.map((item) => {
          const active = navIsActive(pathname, item.href, item.exact)
          return (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 mx-2 px-4 py-2.5 rounded-lg"
              style={{ backgroundColor: active ? '#E4E9FA' : 'transparent', color: active ? '#00236F' : '#666666' }}
              aria-current={active ? 'page' : undefined}>
              {item.icon(active)}
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="border-t" style={{ borderColor: '#EEEEEE' }}>
        <div className="px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#E4E9FA' }}>
              <span className="text-xs font-bold" style={{ color: '#00236F' }}>{initials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate" style={{ color: '#111111' }}>{profile?.full_name ?? 'Loading...'}</p>
              <p className="text-xs mt-0.5" style={{ color: '#666666' }}>{profile?.role ? formatRole(profile.role) : ''}</p>
            </div>
          </div>
          <button type="button" onClick={signOut} className="mt-3 w-full text-left text-xs font-medium" style={{ color: '#666666' }}>
            Sign out
          </button>
        </div>
      </div>
    </aside>
  )
}

function BaseBottomNav({ navItems }: { navItems: NavItem[] }) {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-50 md:hidden" style={{ borderColor: '#EEEEEE', borderTopWidth: '1px' }} aria-label="Main navigation">
      <div className="flex items-center justify-around px-2 h-16">
        {navItems.slice(0, 5).map((item) => {
          const active = navIsActive(pathname, item.href, item.exact)
          return (
            <Link key={item.href} href={item.href}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full"
              style={{ color: active ? '#00236F' : '#BBBBBB' }}
              aria-current={active ? 'page' : undefined}>
              {item.icon(active)}
              <span className="text-[10px] font-medium" style={{ color: active ? '#00236F' : '#BBBBBB' }}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default function BaseLayout({ children, navItems, backButton, messagesHref }: BaseLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ backgroundColor: '#F5F6FA' }}>
      <MobileTopBar backButton={backButton} messagesHref={messagesHref} />
      <BaseSidebar navItems={navItems} backButton={backButton} messagesHref={messagesHref} />
      <main className="flex-1 min-w-0 w-full pb-20 pt-14 md:pt-0 md:pb-0">{children}</main>
      <BaseBottomNav navItems={navItems} />
    </div>
  )
}
