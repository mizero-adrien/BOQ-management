'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/hooks/useNotifications'
import NotificationBell from '@/components/shared/NotificationBell'

interface Props {
  backButton?: boolean
}

export default function MobileTopBar({ backButton }: Props) {
  const { unreadCount } = useNotifications()
  const router = useRouter()

  return (
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
      <NotificationBell unreadCount={unreadCount} />
    </header>
  )
}
