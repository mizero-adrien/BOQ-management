'use client'

export const dynamic = 'force-dynamic'

import { useNotificationContext as useNotifications } from '@/contexts/NotificationContext'
import { useRouter } from 'next/navigation'
import { getRelativeTime } from '@/lib/utils'
import type { Notification } from '@/types/database'
import { SkeletonTable } from '@/components/shared/Skeleton'

function getTypeColor(type: string): string {
  switch (type) {
    case 'task_assigned':
    case 'milestone_reached':
      return '#00236F'
    case 'report_submitted':
    case 'comment_added':
      return '#778EDE'
    case 'report_reminder':
    case 'budget_alert':
    case 'issue_flagged':
      return '#E24B4A'
    default:
      return '#BBBBBB'
  }
}

export default function NotificationsPage() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications()
  const router = useRouter()

  async function handleTap(notification: Notification) {
    if (!notification.read) {
      await markAsRead(notification.id)
    }
    if (notification.action_url) {
      router.push(notification.action_url)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F6FA' }}>
      <div className="bg-white border-b" style={{ borderColor: '#EEEEEE' }}>
        <div className="flex items-center justify-between px-4 pt-12 pb-4">
          <h1 className="text-xl font-semibold" style={{ color: '#111111' }}>
            Notifications
          </h1>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              style={{ color: '#00236F', fontSize: '13px' }}
              className="font-medium"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="bg-white"><SkeletonTable rows={5} /></div>
      ) : notifications.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="bg-white">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onTap={handleTap}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function NotificationItem({
  notification,
  onTap,
}: {
  notification: Notification
  onTap: (n: Notification) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onTap(notification)}
      className="w-full flex items-start gap-3 px-4 py-4 text-left border-b"
      style={{
        backgroundColor: notification.read ? '#FFFFFF' : '#F8F9FF',
        borderColor: '#EEEEEE',
      }}
    >
      <div
        className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
        style={{ backgroundColor: getTypeColor(notification.type) }}
      />
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium leading-snug"
          style={{ color: notification.read ? '#666666' : '#111111' }}
        >
          {notification.title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: '#666666' }}>
          {notification.body}
        </p>
      </div>
      <p
        className="flex-shrink-0 mt-0.5"
        style={{ color: '#BBBBBB', fontSize: '11px' }}
      >
        {getRelativeTime(notification.created_at)}
      </p>
    </button>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#BBBBBB"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      <p className="mt-4 text-sm" style={{ color: '#666666' }}>
        No notifications yet
      </p>
      <p className="mt-1 text-xs" style={{ color: '#BBBBBB' }}>
        You will see task assignments, report reminders, and budget alerts here
      </p>
    </div>
  )
}

