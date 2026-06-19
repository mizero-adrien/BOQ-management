'use client'

import Link from 'next/link'
import { useActiveProject } from '@/hooks/useActiveProject'
import { useProfile } from '@/hooks/useProfile'
import { useConversations } from '@/hooks/useDirectMessages'

export default function MessagesButton({ href }: { href: string }) {
  const { project } = useActiveProject()
  const { profile } = useProfile()
  const { conversations } = useConversations(project?.id ?? '', profile?.id ?? '')
  const unread = conversations.reduce((s, c) => s + c.unread_count, 0)
  const badge = unread >= 10 ? '9+' : String(unread)

  return (
    <Link
      href={href}
      className="relative w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: '#F5F6FA' }}
      aria-label={unread > 0 ? `Messages, ${unread} unread` : 'Messages'}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#BBBBBB" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      {unread > 0 && (
        <span
          className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-white font-semibold leading-none"
          style={{ backgroundColor: '#E24B4A', fontSize: '9px', minWidth: '16px', height: '16px', paddingLeft: '3px', paddingRight: '3px' }}
        >
          {badge}
        </span>
      )}
    </Link>
  )
}
