'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useNotifications } from '@/hooks/useNotifications'
import NotificationBell from '@/components/shared/NotificationBell'
import MessagesButton from '@/components/shared/MessagesButton'

export interface OverflowItem {
  label: string
  href: string
}

interface Props {
  backButton?: boolean
  messagesHref?: string
  overflowItems?: OverflowItem[]
}

export default function MobileTopBar({ backButton, messagesHref, overflowItems }: Props) {
  const { unreadCount } = useNotifications()
  const router = useRouter()
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const hasOverflow = overflowItems && overflowItems.length > 0

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 md:hidden bg-white border-b"
        style={{ height: '56px', borderColor: '#EEEEEE' }}
      >
        <div className="flex items-center gap-1">
          {backButton && (
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Go back"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '2px',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
          )}
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#00236F' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 22V12h6v10" />
                <path d="M9 7h1" /><path d="M14 7h1" />
                <path d="M9 11h1" /><path d="M14 11h1" />
              </svg>
            </div>
            <span className="text-sm font-semibold" style={{ color: '#00236F' }}>Construction Manager</span>
          </Link>
        </div>

        <div className="flex items-center gap-1">
          {messagesHref && <MessagesButton href={messagesHref} />}
          <NotificationBell unreadCount={unreadCount} />
          {hasOverflow && (
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="More navigation"
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'none', border: 'none', cursor: 'pointer', backgroundColor: '#F5F6FA' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#BBBBBB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* Drawer overlay */}
      {hasOverflow && (
        <>
          <div
            className="fixed inset-0 z-50 md:hidden"
            style={{
              backgroundColor: 'rgba(0,0,0,0.4)',
              opacity: drawerOpen ? 1 : 0,
              pointerEvents: drawerOpen ? 'auto' : 'none',
              transition: 'opacity 0.22s ease',
            }}
            onClick={() => setDrawerOpen(false)}
          />
          <div
            className="fixed top-0 right-0 bottom-0 z-50 md:hidden flex flex-col bg-white"
            style={{
              width: '260px',
              transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.22s ease',
              boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
            }}
          >
            {/* Drawer header */}
            <div
              className="flex items-center justify-between px-5 flex-shrink-0"
              style={{ height: '56px', borderBottom: '1px solid #EEEEEE' }}
            >
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#111111' }}>More</span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="w-8 h-8 flex items-center justify-center rounded-full"
                style={{ background: 'none', border: 'none', cursor: 'pointer', backgroundColor: '#F5F6FA' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Drawer items */}
            <nav className="flex-1 overflow-y-auto py-2">
              {overflowItems!.map((item) => {
                const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center justify-between px-5 py-3.5"
                    style={{
                      backgroundColor: isActive ? '#E4E9FA' : 'transparent',
                      borderBottom: '1px solid #EEEEEE',
                      textDecoration: 'none',
                    }}
                  >
                    <span style={{ fontSize: '14px', fontWeight: isActive ? 600 : 500, color: isActive ? '#00236F' : '#111111' }}>
                      {item.label}
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isActive ? '#00236F' : '#BBBBBB'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </Link>
                )
              })}
            </nav>
          </div>
        </>
      )}
    </>
  )
}
