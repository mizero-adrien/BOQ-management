'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useNotificationContext } from '@/contexts/NotificationContext'

export default function NotificationBell({ unreadCount: propCount, href = '/notifications' }: { unreadCount?: number; href?: string }) {
  const ctx = useNotificationContext()
  const unreadCount = propCount !== undefined ? propCount : ctx.unreadCount
  const badgeLabel = unreadCount >= 10 ? '9+' : String(unreadCount)

  const prevRef = useRef(unreadCount)
  const [ringing, setRinging] = useState(false)

  useEffect(() => {
    if (unreadCount > prevRef.current) {
      setRinging(true)
      const t = setTimeout(() => setRinging(false), 700)
      return () => clearTimeout(t)
    }
    prevRef.current = unreadCount
  }, [unreadCount])

  return (
    <Link
      href={href}
      className="relative w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: '#F5F6FA' }}
      aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
    >
      <svg
        width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke={unreadCount > 0 ? '#00236F' : '#BBBBBB'}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={ringing ? { animation: 'bell-ring 0.65s ease both', transformOrigin: 'top center' } : undefined}
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unreadCount > 0 && (
        <span
          className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-white font-semibold leading-none"
          style={{ backgroundColor: '#E24B4A', fontSize: '9px', minWidth: '16px', height: '16px', paddingLeft: '3px', paddingRight: '3px' }}
        >
          {badgeLabel}
        </span>
      )}
    </Link>
  )
}
