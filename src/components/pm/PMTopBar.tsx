'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useNotifications } from '@/hooks/useNotifications'

interface ActionConfig {
  label: string
  onClick: () => void
  icon?: React.ReactNode
}

interface PMTopBarProps {
  title: string
  subtitle?: string
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  primaryAction?: ActionConfig
  secondaryAction?: ActionConfig
}

export default function PMTopBar({
  title,
  subtitle,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  primaryAction,
  secondaryAction,
}: PMTopBarProps) {
  const { unreadCount } = useNotifications()
  const [searchFocused, setSearchFocused] = useState(false)
  const [secondaryHovered, setSecondaryHovered] = useState(false)

  const hasActions = primaryAction !== undefined || secondaryAction !== undefined

  return (
    <header style={{
      backgroundColor: '#FFFFFF',
      borderBottom: '1px solid #DDE3E8',
      padding: '0 24px',
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>

      {/* Left: title + subtitle */}
      <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <span style={{ fontSize: '18px', fontWeight: 600, color: '#1A2332', lineHeight: 1.2 }}>
          {title}
        </span>
        {subtitle && (
          <span style={{ fontSize: '11px', color: '#8FA3B3', lineHeight: 1.4 }}>
            {subtitle}
          </span>
        )}
      </div>

      {/* Middle: search — desktop only */}
      {searchPlaceholder !== undefined && onSearchChange !== undefined && (
        <div className="hidden md:block" style={{ flex: 1, maxWidth: '400px', margin: '0 4px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <svg
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="#8FA3B3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue ?? ''}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{
                width: '100%',
                padding: '7px 12px 7px 32px',
                fontSize: '13px',
                backgroundColor: '#F4F6F8',
                border: searchFocused ? '1px solid #1565D8' : '1px solid #DDE3E8',
                borderRadius: '6px',
                color: '#1A2332',
                outline: 'none',
              }}
            />
          </div>
        </div>
      )}

      {/* Right: icons + optional action buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: 'auto' }}>

        {/* Message icon */}
        <Link href="/pm/messages" className="pm-top-icon-btn" aria-label="Messages">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </Link>

        {/* Notification bell */}
        <Link href="/pm/notifications" className="pm-top-icon-btn" aria-label="Notifications"
          style={{ position: 'relative' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: '7px', right: '7px',
              width: '7px', height: '7px', borderRadius: '50%',
              backgroundColor: '#E24B4A',
            }} />
          )}
        </Link>

        {/* Divider — only when action buttons present */}
        {hasActions && (
          <div style={{ width: '1px', height: '20px', backgroundColor: '#DDE3E8', margin: '0 4px' }} />
        )}

        {/* Primary action */}
        {primaryAction && (
          <button
            type="button"
            onClick={primaryAction.onClick}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '7px 12px',
              backgroundColor: '#1565D8', color: '#FFFFFF',
              border: 'none', borderRadius: '6px',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              flexShrink: 0,
            }}>
            {primaryAction.icon}
            <span className="hidden md:inline">{primaryAction.label}</span>
          </button>
        )}

        {/* Secondary action — hidden on mobile */}
        {secondaryAction && (
          <button
            type="button"
            onClick={secondaryAction.onClick}
            onMouseEnter={() => setSecondaryHovered(true)}
            onMouseLeave={() => setSecondaryHovered(false)}
            className="hidden md:flex"
            style={{
              alignItems: 'center', gap: '4px',
              padding: '7px 12px',
              backgroundColor: secondaryHovered ? '#F4F6F8' : '#FFFFFF',
              color: '#1A2332',
              border: '1px solid #DDE3E8', borderRadius: '6px',
              fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              flexShrink: 0,
            }}>
            {secondaryAction.icon}
            {secondaryAction.label}
          </button>
        )}
      </div>
    </header>
  )
}
